export function normalizeLicensePlate(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[–—]/g, "-");
}

export function isValidVietnamLicensePlate(value) {
  const plate = normalizeLicensePlate(value);
  return /^\d{2}[A-Z]{1,2}\d?-\d{3}(\.\d{2}|\d{2})$/.test(plate);
}

export const LICENSE_PLATE_HINT = "Biển số phải đúng định dạng, ví dụ: 51F-123.45, 30A-12345 hoặc 59X1-12345";
