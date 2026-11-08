/**
 * True while a usable phone number is typed but its member lookup has not finished.
 * `lookedUpPhone` is the trimmed number the last lookup completed for (found, not found or failed).
 */
export function isMemberLookupPending(memberPhone, lookedUpPhone) {
  const phone = String(memberPhone || '');
  return phone.replace(/\D/g, '').length >= 7 && lookedUpPhone !== phone.trim();
}
