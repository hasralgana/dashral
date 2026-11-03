/** The Settings page's tabs, in order; the first is the default. `?tab=` picks one. */
export const settingsTabs = ["profile", "account", "notifications", "appearance"] as const
export type SettingsTab = (typeof settingsTabs)[number]
