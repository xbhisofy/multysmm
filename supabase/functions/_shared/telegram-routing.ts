export function telegramRoute(kind: unknown): "fund" | "operations" {
  return kind === "deposit_success" ? "fund" : "operations";
}

export function escapeTelegram(value: unknown): string {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}