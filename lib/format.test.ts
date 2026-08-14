import { classifyStatus, daysUntil, nextValidReminderFireDate, reminderFireDate, toDateOnly } from './format';

describe('daysUntil', () => {
  it('counts whole calendar days, not elapsed hours', () => {
    const now = new Date(2026, 0, 1, 23, 59); // Jan 1, 23:59 local
    expect(daysUntil('2026-01-01', now)).toBe(0);
    expect(daysUntil('2026-01-02', now)).toBe(1);
  });

  it('crosses month boundaries correctly', () => {
    expect(daysUntil('2026-02-01', new Date(2026, 0, 31))).toBe(1);
  });

  it('is negative for dates already passed', () => {
    expect(daysUntil('2026-01-01', new Date(2026, 0, 4))).toBe(-3);
  });
});

describe('toDateOnly', () => {
  it('formats as YYYY-MM-DD from local date parts', () => {
    expect(toDateOnly(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toDateOnly(new Date(2026, 10, 23))).toBe('2026-11-23');
  });
});

describe('classifyStatus', () => {
  it('classifies expired (days < 0) as expired', () => {
    expect(classifyStatus(-1)).toBe('expired');
    expect(classifyStatus(-30)).toBe('expired');
  });

  it('classifies 0 days as today', () => {
    expect(classifyStatus(0)).toBe('today');
  });

  it('classifies 1-2 days as critical', () => {
    expect(classifyStatus(1)).toBe('critical');
    expect(classifyStatus(2)).toBe('critical');
  });

  it('classifies 3-7 days as soon', () => {
    expect(classifyStatus(3)).toBe('soon');
    expect(classifyStatus(7)).toBe('soon');
  });

  it('classifies more than 7 days as fresh', () => {
    expect(classifyStatus(8)).toBe('fresh');
    expect(classifyStatus(365)).toBe('fresh');
  });
});

describe('reminderFireDate', () => {
  it('subtracts reminderDays as whole calendar days at 09:00 local', () => {
    const fireDate = reminderFireDate('2026-01-10', 3);
    expect(toDateOnly(fireDate)).toBe('2026-01-07');
    expect(fireDate.getHours()).toBe(9);
    expect(fireDate.getMinutes()).toBe(0);
  });
});

describe('nextValidReminderFireDate', () => {
  it('returns the plain reminder time when it is still in the future', () => {
    const now = new Date(2026, 0, 1, 8, 0);
    const result = nextValidReminderFireDate('2026-01-10', 3, now);
    expect(result && toDateOnly(result)).toBe('2026-01-07');
  });

  it('advances day by day to the next unpassed 09:00 when the reminder time already passed', () => {
    // reminder target (Jan 7, 09:00) has passed; expiry (Jan 10) is still ahead.
    const now = new Date(2026, 0, 8, 10, 0);
    const result = nextValidReminderFireDate('2026-01-10', 3, now);
    expect(result).not.toBeNull();
    expect(toDateOnly(result!)).toBe('2026-01-09');
    expect(result!.getHours()).toBe(9);
  });

  it('stops exactly at the expiry day when its own 09:00 has not passed yet', () => {
    // Boundary: now is before the expiry day's 09:00, so that moment is still valid.
    const now = new Date(2026, 0, 10, 8, 0);
    const result = nextValidReminderFireDate('2026-01-10', 3, now);
    expect(result).not.toBeNull();
    expect(toDateOnly(result!)).toBe('2026-01-10');
  });

  it('returns null once the expiry day’s own reminder time has also passed', () => {
    const now = new Date(2026, 0, 10, 10, 0); // after the expiry day's 09:00
    const result = nextValidReminderFireDate('2026-01-10', 3, now);
    expect(result).toBeNull();
  });
});
