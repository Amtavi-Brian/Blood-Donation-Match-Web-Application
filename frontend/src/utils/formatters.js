export function formatDate(dateString, options = {}) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, options);
}

export function formatDateTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export function formatNumber(value) {
  if (value == null) return "0";
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatUnits(quantity) {
  const count = Number(quantity) || 0;
  return `${count} unit${count === 1 ? "" : "s"}`;
}
