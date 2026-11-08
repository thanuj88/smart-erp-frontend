const norm = (value) => String(value ?? '').toLowerCase().replace(/\s+/g, '');

/** POS installment-payment search: customer name, phone, NIC or order number. Safe on missing fields. */
export function planMatchesSearch(plan, query) {
  const q = norm(query);
  if (!q) return true;
  return [plan?.customer_name, plan?.customer_phone, plan?.customer_id_card, plan?.order_number].some((field) =>
    norm(field).includes(q)
  );
}
