export function formatKg(value: number): string {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}
