export type Category = 'dairy' | 'produce' | 'meat' | 'pantry' | 'frozen' | 'other';

export type ExpiryStatus = 'expired' | 'today' | 'critical' | 'soon' | 'fresh';

export type Item = {
  id: string;
  name: string;
  /** Date-only "YYYY-MM-DD", no time/timezone component. */
  expiryDate: string;
  category?: Category;
  quantity?: number;
  unit?: string;
  /** App-managed local file path (copied via expo-file-system), not the original picker URI. */
  photoUri?: string;
  /** Overrides Settings.defaultReminderDays for this item when set. */
  reminderDaysOverride?: number;
  createdAt: string;
};

export type Settings = {
  defaultReminderDays: number;
};
