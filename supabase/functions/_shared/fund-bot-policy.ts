export function isFundAdminChat(chatId: unknown, allowed: string): boolean {
  return Boolean(allowed.trim()) && allowed.split(',').map(s => s.trim()).includes(String(chatId));
}

export function fundBotCommand(text: string): 'balance' | 'plan' | 'menu' {
  const value = text.trim().toLowerCase().split('@')[0];
  if (value === '/bal' || value === '/balance' || value === '💰 live balance') return 'balance';
  if (value === '/plan' || value === '📊 top-up plan') return 'plan';
  return 'menu';
}

export async function withDeadline<T>(work: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([work, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Request timed out')), milliseconds);
    })]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}