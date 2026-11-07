import { describe, expect, it } from 'vitest';
import { fundBotCommand, isFundAdminChat, withDeadline } from '../../supabase/functions/_shared/fund-bot-policy';

describe('private fund bot', () => {
  it('allows only the configured admin chat', () => {
    expect(isFundAdminChat(123, '123')).toBe(true);
    expect(isFundAdminChat(456, '123')).toBe(false);
    expect(isFundAdminChat(123, '')).toBe(false);
  });
  it('routes /bal and the balance button to live balances', () => {
    expect(fundBotCommand('/bal')).toBe('balance');
    expect(fundBotCommand('💰 Live Balance')).toBe('balance');
  });
  it('routes the top-up button to the same report', () => {
    expect(fundBotCommand('📊 Top-up Plan')).toBe('plan');
    expect(fundBotCommand('/plan')).toBe('plan');
  });
  it('ends a stuck upstream request', async () => {
    await expect(withDeadline(new Promise(() => {}), 10)).rejects.toThrow('Request timed out');
  });
});