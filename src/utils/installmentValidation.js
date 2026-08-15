function normalizeName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeId(value) {
  return String(value || '').trim().replace(/[\s-]/g, '').toUpperCase();
}

const OLD_NIC = /^[0-9]{9}[VX]$/;
const NEW_NIC = /^[0-9]{12}$/;

export function normalizeNic(value) {
  return String(value ?? '').trim().toUpperCase();
}

export function isValidNic(value) {
  const nic = normalizeNic(value);
  return OLD_NIC.test(nic) || NEW_NIC.test(nic);
}

export const NIC_FORMAT_MESSAGE =
  'Enter a valid NIC (901234567V / 901234567X, or 12 digits e.g. 199012345678)';

/** Strip spaces, uppercase V/X, allow only digits/V/X, max 12 characters. */
export function sanitizeNicInput(value) {
  const cleaned = String(value ?? '')
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/[^0-9VX]/g, '');

  const letterAt = cleaned.search(/[VX]/);
  if (letterAt !== -1) {
    const digits = cleaned.slice(0, letterAt).replace(/\D/g, '').slice(0, 9);
    return `${digits}${cleaned[letterAt]}`.slice(0, 10);
  }

  return cleaned.slice(0, 12);
}

export function getCustomerWitnessDuplicates(customer, witness) {
  const duplicates = [];
  const customerName = normalizeName(customer?.name);
  const witnessName = normalizeName(witness?.name);
  if (customerName && witnessName && customerName === witnessName) {
    duplicates.push('name');
  }

  const customerPhone = normalizePhone(customer?.phone);
  const witnessPhone = normalizePhone(witness?.phone);
  if (customerPhone && witnessPhone && customerPhone === witnessPhone) {
    duplicates.push('phone');
  }

  const customerId = normalizeId(customer?.idCardNo);
  const witnessId = normalizeId(witness?.idCardNo);
  if (customerId && witnessId && customerId === witnessId) {
    duplicates.push('id');
  }

  return duplicates;
}

export function validateDistinctCustomerAndWitness(customer, witness) {
  const duplicates = getCustomerWitnessDuplicates(customer, witness);
  if (duplicates.length === 0) return null;

  const labels = {
    name: 'name',
    phone: 'phone number',
    id: 'ID number',
  };
  const fields = duplicates.map((field) => labels[field]).join(', ');
  return `Customer and witness cannot use the same ${fields}.`;
}

function isBlank(value) {
  return !String(value ?? '').trim();
}

export function getInstallmentFieldErrors(customer, witness, downPayment, orderTotal) {
  const errors = {};

  if (isBlank(customer?.name)) errors['customer.name'] = true;
  if (isBlank(customer?.phone)) errors['customer.phone'] = true;
  if (isBlank(customer?.idCardNo)) errors['customer.idCardNo'] = true;
  else if (!isValidNic(customer.idCardNo)) errors['customer.idCardNo'] = true;
  if (isBlank(customer?.address)) errors['customer.address'] = true;

  if (isBlank(witness?.name)) errors['witness.name'] = true;
  if (isBlank(witness?.phone)) errors['witness.phone'] = true;
  if (isBlank(witness?.idCardNo)) errors['witness.idCardNo'] = true;
  else if (!isValidNic(witness.idCardNo)) errors['witness.idCardNo'] = true;
  if (isBlank(witness?.address)) errors['witness.address'] = true;

  getCustomerWitnessDuplicates(customer, witness).forEach((dup) => {
    if (dup === 'name') {
      errors['customer.name'] = true;
      errors['witness.name'] = true;
    }
    if (dup === 'phone') {
      errors['customer.phone'] = true;
      errors['witness.phone'] = true;
    }
    if (dup === 'id') {
      errors['customer.idCardNo'] = true;
      errors['witness.idCardNo'] = true;
    }
  });

  const downStr = String(downPayment ?? '').trim();
  const down = parseFloat(downPayment);
  if (!downStr || Number.isNaN(down) || down <= 0) {
    errors.downPayment = true;
  } else if (orderTotal > 0 && down >= orderTotal) {
    errors.downPayment = true;
  }

  return errors;
}

export function getInstallmentValidationMessage(fieldErrors, customer, witness, downPayment, orderTotal) {
  const keys = Object.keys(fieldErrors);
  if (keys.length === 0) return null;

  const invalidCustomerNic =
    fieldErrors['customer.idCardNo'] &&
    !isBlank(customer?.idCardNo) &&
    !isValidNic(customer.idCardNo);
  const invalidWitnessNic =
    fieldErrors['witness.idCardNo'] &&
    !isBlank(witness?.idCardNo) &&
    !isValidNic(witness.idCardNo);

  if (invalidCustomerNic || invalidWitnessNic) {
    return NIC_FORMAT_MESSAGE;
  }

  const customerRequired = ['customer.name', 'customer.phone', 'customer.idCardNo', 'customer.address'];
  const witnessRequired = ['witness.name', 'witness.phone', 'witness.idCardNo', 'witness.address'];

  if (customerRequired.some((key) => fieldErrors[key])) {
    return 'Please fill in all customer details';
  }
  if (witnessRequired.some((key) => fieldErrors[key])) {
    return 'Please fill in all witness details';
  }

  const duplicateMessage = validateDistinctCustomerAndWitness(customer, witness);
  if (duplicateMessage) return duplicateMessage;

  if (fieldErrors.downPayment) {
    const down = parseFloat(downPayment);
    if (!String(downPayment ?? '').trim() || Number.isNaN(down) || down <= 0) {
      return 'Please enter a valid down payment';
    }
    return 'Down payment must be less than total amount';
  }

  return 'Please correct the highlighted fields';
}
