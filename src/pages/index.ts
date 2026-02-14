export { Landing } from "./Landing";
export { default as SlidesPage } from "./SlidesPage";

// Onboarding (rutas públicas)
export { default as AuthCallbackPage } from "./onboarding/AuthCallbackPage";
export { default as ConnectCloudPage } from "./onboarding/ConnectCloudPage";
export { default as SetupPasswordPage } from "./onboarding/SetupPasswordPage";
export { default as SetupSecurityModePage } from "./onboarding/SetupSecurityModePage";
export { default as SetupSecretKeyPage } from "./onboarding/SetupSecretKeyPage";

// Vault (rutas protegidas)
export { default as VaultPage } from "./vault/VaultPage";
export { default as EntryDetailPage } from "./vault/EntryDetailPage";
export { default as EntryFormPage } from "./vault/EntryFormPage";
export { default as GeneratorPage } from "./vault/GeneratorPage";
export { default as SearchPage } from "./vault/SearchPage";

// Settings (rutas protegidas)
export { default as SettingsPage } from "./settings/SettingsPage";
export { default as ChangePasswordPage } from "./settings/ChangePasswordPage";
export { default as FoldersPage } from "./settings/FoldersPage";
export { default as SecurityAuditPage } from "./settings/SecurityAuditPage";
export { default as ExportPage } from "./settings/ExportPage";
export { default as ImportPage } from "./settings/ImportPage";

// Special
export { default as LockScreenPage } from "./special/LockScreenPage";
export { default as OfflinePage } from "./special/OfflinePage";
export { default as ErrorPage } from "./special/ErrorPage";
