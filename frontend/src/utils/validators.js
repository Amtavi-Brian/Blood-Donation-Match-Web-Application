// Kenyan mobile: 07xxxxxxxx, 01xxxxxxxx, or +254 followed by 7/1 and 8 digits
const PHONE_PATTERN = /^(?:\+254|0)[17]\d{8}$/;

export function isValidKenyanPhone(phone) {
  return PHONE_PATTERN.test(phone.replace(/\s/g, ""));
}