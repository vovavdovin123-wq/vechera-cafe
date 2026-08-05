/** Нормализация телефона для сравнения и хранения */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) {
    return `7${digits.slice(1)}`;
  }
  if (digits.length === 10) return `7${digits}`;
  return digits;
}

export function isValidPhone(input: string): boolean {
  const n = normalizePhone(input);
  return n.length >= 10 && n.length <= 12;
}

export function formatPhoneDisplay(input: string): string {
  const n = normalizePhone(input);
  if (n.length === 11 && n.startsWith("7")) {
    return `+7 (${n.slice(1, 4)}) ${n.slice(4, 7)}-${n.slice(7, 9)}-${n.slice(9, 11)}`;
  }
  return input.trim();
}
