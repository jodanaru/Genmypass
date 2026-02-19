import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Check,
  Copy,
  Globe,
  Eye,
  EyeOff,
  Save,
  Star,
  Trash2,
  Wand2,
} from "lucide-react";
import {
  classifyApiError,
  getApiErrorMessageKey,
  type ApiErrorClassification,
} from "@/lib/api-errors";
import { useVault } from "@/hooks/useVault";
import { useClipboard } from "@/hooks/useClipboard";
import { useVaultStore } from "@/stores/vault-store";
import { useSettingsStore } from "@/stores/settings-store";
import {
  generatePassword,
  getPasswordStrength,
  getStrengthBarColorClass,
  getStrengthTextColorClass,
  LENGTH_MAX,
  LENGTH_MIN,
  type GeneratePasswordOptions,
} from "@/lib/password-generator";
import { checkPasswordBreach } from "@/lib/hibp";
import { BreachWarning } from "@/components/vault";
import {
  sanitize,
  sanitizeUrl,
  MAX_TITLE_LENGTH,
  MAX_USERNAME_LENGTH,
  MAX_NOTES_LENGTH,
} from "@/lib/sanitize";

interface LocationState {
  generatedPassword?: string;
}

export default function EntryFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isNew = location.pathname === "/entry/new";
  const state = location.state as LocationState | null;

  const { entries, folders, save } = useVault();
  const { copy: copyToClipboard } = useClipboard();
  const addEntry = useVaultStore((s) => s.addEntry);
  const updateEntry = useVaultStore((s) => s.updateEntry);
  const deleteEntry = useVaultStore((s) => s.deleteEntry);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [folderId, setFolderId] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [nameError, setNameError] = useState("");
  const [saveErrorClassification, setSaveErrorClassification] =
    useState<ApiErrorClassification | null>(null);
  const [lastFailedAction, setLastFailedAction] = useState<
    "save" | "delete" | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [breachResult, setBreachResult] = useState<{
    breached: boolean;
    count: number;
  } | null>(null);

  const [genLength, setGenLength] = useState(() =>
    useSettingsStore.getState().defaultPasswordLength
  );
  const [genUppercase, setGenUppercase] = useState(() =>
    useSettingsStore.getState().includeUppercase
  );
  const [genLowercase, setGenLowercase] = useState(() =>
    useSettingsStore.getState().includeLowercase
  );
  const [genNumbers, setGenNumbers] = useState(() =>
    useSettingsStore.getState().includeNumbers
  );
  const [genSymbols, setGenSymbols] = useState(() =>
    useSettingsStore.getState().includeSymbols
  );
  const [genExcludeAmbiguous, setGenExcludeAmbiguous] = useState(() =>
    useSettingsStore.getState().excludeAmbiguousCharacters
  );
  const [genAllowDuplicate, setGenAllowDuplicate] = useState(() =>
    useSettingsStore.getState().allowDuplicateCharacters
  );

  const entry = useMemo(
    () => (id ? entries.find((e) => e.id === id) : null),
    [id, entries]
  );

  const isFirstGeneratorConfigMount = useRef(true);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew) {
      isFirstGeneratorConfigMount.current = true;
      setTitle("");
      setUrl("");
      setUsername("");
      setPassword(state?.generatedPassword ?? "");
      setNotes("");
      setFolderId("");
      setFavorite(false);
      setPasswordVisible(false);
      setNameError("");
      setSaveErrorClassification(null);
    } else if (entry) {
      setTitle(entry.title);
      setUrl(entry.url ?? "");
      setUsername(entry.username ?? "");
      setPassword(entry.password ?? "");
      setNotes(entry.notes ?? "");
      setFolderId(entry.folderId ?? "");
      setFavorite(entry.favorite ?? false);
      setPasswordVisible(false);
      setNameError("");
      setSaveErrorClassification(null);
    }
  }, [isNew, entry, state?.generatedPassword]);

  useEffect(() => {
    if (isNew || (id && entry)) {
      requestAnimationFrame(() => firstFieldRef.current?.focus());
    }
  }, [isNew, id, entry]);

  useEffect(() => {
    if (!isNew && id && entries.length > 0 && !entry) {
      navigate("/vault", { replace: true });
    }
  }, [isNew, id, entries, entry, navigate]);

  useEffect(() => {
    if (!password) {
      setBreachResult(null);
      return;
    }
    const timer = window.setTimeout(() => {
      checkPasswordBreach(password).then(setBreachResult);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [password]);

  const generateOptions: GeneratePasswordOptions = useMemo(
    () => ({
      length: genLength,
      includeUppercase: genUppercase,
      includeLowercase: genLowercase,
      includeNumbers: genNumbers,
      includeSymbols: genSymbols,
      excludeAmbiguousCharacters: genExcludeAmbiguous,
      allowDuplicateCharacters: genAllowDuplicate,
    }),
    [
      genLength,
      genUppercase,
      genLowercase,
      genNumbers,
      genSymbols,
      genExcludeAmbiguous,
      genAllowDuplicate,
    ]
  );

  const canGenerate =
    genUppercase || genLowercase || genNumbers || genSymbols;

  useEffect(() => {
    if (!isNew) return;
    if (isFirstGeneratorConfigMount.current) {
      isFirstGeneratorConfigMount.current = false;
      if (state?.generatedPassword) return;
    }
    if (!canGenerate) {
      setPassword("");
      return;
    }
    const options: GeneratePasswordOptions = {
      length: genLength,
      includeUppercase: genUppercase,
      includeLowercase: genLowercase,
      includeNumbers: genNumbers,
      includeSymbols: genSymbols,
      excludeAmbiguousCharacters: genExcludeAmbiguous,
      allowDuplicateCharacters: genAllowDuplicate,
    };
    queueMicrotask(() => {
      try {
        setPassword(generatePassword(options));
      } catch {
        setPassword("");
      }
    });
  }, [
    isNew,
    canGenerate,
    genLength,
    genUppercase,
    genLowercase,
    genNumbers,
    genSymbols,
    genExcludeAmbiguous,
    genAllowDuplicate,
  ]);

  const handleGeneratePassword = useCallback(() => {
    if (!canGenerate) return;
    try {
      const next = generatePassword(generateOptions);
      setPassword(next);
    } catch {
      setPassword("");
    }
  }, [generateOptions, canGenerate]);

  const handleCopyPassword = useCallback(async () => {
    if (!password) return;
    const ok = await copyToClipboard(password);
    setCopySuccess(ok);
    if (ok) setTimeout(() => setCopySuccess(false), 5000);
  }, [password, copyToClipboard]);

  const strength = password ? getPasswordStrength(password) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    setSaveErrorClassification(null);
    const safeTitle = sanitize(title, MAX_TITLE_LENGTH);
    if (!safeTitle) {
      setNameError(t("entry.nameRequired"));
      return;
    }
    const safeUsername = sanitize(username, MAX_USERNAME_LENGTH);
    const safeUrl = sanitizeUrl(url) || undefined;
    const safeNotes = sanitize(notes, MAX_NOTES_LENGTH) || undefined;
    const safeFolderId = folderId.trim() || undefined;

    setIsSaving(true);
    try {
      if (isNew) {
        const now = new Date().toISOString();
        addEntry({
          id: crypto.randomUUID(),
          title: safeTitle,
          username: safeUsername,
          password,
          url: safeUrl,
          notes: safeNotes,
          folderId: safeFolderId,
          favorite,
          createdAt: now,
          updatedAt: now,
        });
      } else if (id) {
        updateEntry(id, {
          title: safeTitle,
          username: safeUsername,
          password,
          url: safeUrl,
          notes: safeNotes,
          folderId: safeFolderId,
          favorite,
        });
      }
      await save();
      navigate("/vault");
    } catch (err) {
      console.error("Error saving entry:", err);
      setSaveErrorClassification(classifyApiError(err));
      setLastFailedAction("save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = useCallback(
    async (skipConfirm = false) => {
      if (!id) return;
      if (!skipConfirm) {
        const confirmed = window.confirm(t("entry.deleteConfirm"));
        if (!confirmed) return;
      }
      setIsDeleting(true);
      setSaveErrorClassification(null);
      setLastFailedAction(null);
      try {
        deleteEntry(id);
        await save();
        navigate("/vault");
      } catch (err) {
        console.error("Error deleting entry:", err);
        setSaveErrorClassification(classifyApiError(err));
        setLastFailedAction("delete");
      } finally {
        setIsDeleting(false);
      }
    },
    [id, deleteEntry, save, navigate, t]
  );

  const cancelTo = "/vault";

  return (
    <div className="min-h-full flex flex-col bg-surface dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-[var(--bg-card)] px-4 md:px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={cancelTo}
            className="shrink-0 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={t("entry.ariaBack")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-lg font-bold leading-tight tracking-tight text-[var(--text)] truncate">
            {isNew ? t("entry.newPassword") : t("entry.editPassword")}
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={cancelTo}
            className="flex min-w-[84px] items-center justify-center rounded-lg h-10 px-4 bg-slate-100 dark:bg-slate-800 text-[var(--text)] text-sm font-bold transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            {t("entry.cancel")}
          </Link>
          <button
            type="submit"
            form="entry-form"
            disabled={isSaving}
            className="flex min-w-[84px] items-center justify-center rounded-lg h-10 px-4 bg-primary-500 text-white text-sm font-bold shadow-sm hover:bg-primary-600 disabled:opacity-50 transition-all"
          >
            {t("entry.save")}
          </button>
          {!isNew && id && (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="flex items-center justify-center rounded-lg h-10 w-10 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 transition-colors"
              aria-label={t("entry.ariaDelete")}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 flex justify-center py-6 px-4">
        <div className="w-full max-w-[640px] flex flex-col gap-6 bg-[var(--bg-card)] p-6 md:p-10 rounded-xl shadow-card border border-slate-200 dark:border-slate-800">
          <form
            id="entry-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
          >
            {saveErrorClassification && (
              <div
                role="alert"
                className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-4 py-2 rounded-lg flex flex-col gap-2"
              >
                <p>{t(getApiErrorMessageKey(saveErrorClassification.type))}</p>
                {saveErrorClassification.retryable && (
                  <button
                    type="button"
                    onClick={() => {
                      setSaveErrorClassification(null);
                      if (lastFailedAction === "save") {
                        void handleSubmit({
                          preventDefault: () => {},
                        } as React.FormEvent);
                      } else if (lastFailedAction === "delete" && id) {
                        void handleDelete(true);
                      }
                      setLastFailedAction(null);
                    }}
                    className="text-left font-semibold underline hover:no-underline"
                  >
                    {t("common.retry")}
                  </button>
                )}
              </div>
            )}

            {/* Identity */}
            <div className="space-y-4">
              <label htmlFor="entry-name" className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[var(--text)]">
                  {t("entry.name")} <span className="text-red-500" aria-hidden>*</span>
                </span>
                <input
                  ref={firstFieldRef}
                  id="entry-name"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (nameError) setNameError("");
                  }}
                  placeholder={t("entry.placeholderName")}
                  maxLength={MAX_TITLE_LENGTH}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-12 px-4 text-base placeholder:text-slate-400 disabled:opacity-50"
                  aria-required="true"
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? "entry-name-error" : undefined}
                />
                {nameError && (
                  <p id="entry-name-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
                    {nameError}
                  </p>
                )}
              </label>

              <label htmlFor="entry-url" className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[var(--text)]">
                  {t("entry.websiteUrl")}
                </span>
                <div className="flex w-full items-stretch">
                  <div className="flex border border-slate-300 dark:border-slate-600 border-r-0 rounded-l-lg bg-slate-50 dark:bg-slate-800 items-center justify-center px-3 text-slate-500 dark:text-slate-400">
                    <Globe className="w-5 h-5" aria-hidden />
                  </div>
                  <input
                    id="entry-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t("entry.placeholderUrl")}
                    maxLength={2048}
                    className="flex-1 rounded-r-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-12 px-4 text-base placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label htmlFor="entry-username" className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[var(--text)]">
                  {t("entry.username")}
                </span>
                <input
                  id="entry-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("entry.placeholderUsername")}
                  maxLength={MAX_USERNAME_LENGTH}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-12 px-4 text-base placeholder:text-slate-400"
                />
              </label>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-[var(--text)]">
                    {t("entry.password")}
                  </span>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    disabled={!canGenerate}
                    className="text-xs font-bold text-primary-500 hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1"
                  >
                    <Wand2 className="w-3.5 h-3.5" aria-hidden />
                    {t("entry.generate")}
                  </button>
                </div>
                <div className="flex w-full items-stretch">
                  <input
                    id="entry-password"
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("entry.placeholderPassword")}
                    className="flex-1 rounded-l-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-12 px-4 text-base placeholder:text-slate-400 font-mono"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible((v) => !v)}
                    className="flex border border-slate-300 dark:border-slate-600 border-l-0 bg-white dark:bg-slate-900 items-center justify-center px-3 text-slate-500 dark:text-slate-400 hover:text-primary-500 transition-colors"
                    aria-label={passwordVisible ? t("entry.ariaHidePassword") : t("entry.ariaShowPassword")}
                  >
                    {passwordVisible ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    disabled={!password}
                    className={`flex border border-slate-300 dark:border-slate-600 border-l-0 rounded-r-lg bg-white dark:bg-slate-900 items-center justify-center px-3 disabled:opacity-50 transition-colors ${
                      copySuccess
                        ? "text-primary-500"
                        : "text-slate-500 dark:text-slate-400 hover:text-primary-500"
                    }`}
                    aria-label={copySuccess ? t("entry.ariaCopied") : t("entry.ariaCopyPassword")}
                  >
                    {copySuccess ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {strength && (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-1 h-1.5 w-full" aria-hidden>
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full ${
                            i <= strength.bars
                              ? getStrengthBarColorClass(strength)
                              : "bg-slate-200 dark:bg-slate-600"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("entry.strength")}:{" "}
                      <span className={`font-bold ${getStrengthTextColorClass(strength)}`}>
                        {strength.label}
                      </span>
                    </p>
                  </div>
                )}
                {breachResult?.breached && (
                  <BreachWarning breachCount={breachResult.count} className="mt-2" />
                )}
              </div>

              {/* Generator options */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("entry.generatorSettings")}
                </h3>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-[var(--text)]">
                    {t("entry.length")}
                  </span>
                  <span className="px-3 py-1 bg-primary-500/10 text-primary-500 rounded-lg font-bold text-sm">
                    {genLength}
                  </span>
                </div>
                <div className="flex h-6 w-full items-center gap-4">
                  <input
                    type="range"
                    min={LENGTH_MIN}
                    max={LENGTH_MAX}
                    value={genLength}
                    onChange={(e) => setGenLength(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none bg-slate-300 dark:bg-slate-600 cursor-pointer accent-primary-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary-500"
                    aria-label={t("entry.ariaLength")}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  <span>{LENGTH_MIN}</span>
                  <span>{LENGTH_MAX}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    {
                      label: t("entry.uppercase"),
                      value: genUppercase,
                      set: setGenUppercase,
                    },
                    {
                      label: t("entry.lowercase"),
                      value: genLowercase,
                      set: setGenLowercase,
                    },
                    {
                      label: t("entry.numbers"),
                      value: genNumbers,
                      set: setGenNumbers,
                    },
                    {
                      label: t("entry.symbols"),
                      value: genSymbols,
                      set: setGenSymbols,
                    },
                    {
                      label: t("entry.excludeAmbiguous"),
                      value: genExcludeAmbiguous,
                      set: setGenExcludeAmbiguous,
                    },
                    {
                      label: t("entry.allowDuplicate"),
                      value: genAllowDuplicate,
                      set: setGenAllowDuplicate,
                    },
                  ].map(({ label, value, set }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <span className="text-sm font-medium text-[var(--text)]">
                        {label}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={value}
                        onClick={() => set(!value)}
                        className={`w-10 h-6 rounded-full relative flex items-center px-1 cursor-pointer transition-colors ${
                          value ? "bg-primary-500" : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      >
                        <span
                          className={`size-4 bg-white rounded-full shadow-sm block transition-transform ${
                            value ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
              <label htmlFor="entry-notes" className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[var(--text)]">
                  {t("entry.notes")}
                </span>
                <textarea
                  id="entry-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("entry.notesPlaceholder")}
                  rows={4}
                  maxLength={MAX_NOTES_LENGTH}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 min-h-[100px] p-4 text-base placeholder:text-slate-400 resize-y"
                />
              </label>

              <label htmlFor="entry-folder" className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[var(--text)]">
                  {t("entry.category")}
                </span>
                <select
                  id="entry-folder"
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-12 px-4 text-base"
                >
                  <option value="">{t("entry.uncategorized")}</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Star
                    className={`w-5 h-5 shrink-0 ${
                      favorite ? "text-primary-500 fill-primary-500" : "text-slate-400 dark:text-slate-500"
                    }`}
                    aria-hidden
                  />
                  <div>
                    <span className="text-sm font-medium text-[var(--text)] block">
                      {t("entry.addToFavorites")}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t("entry.showInFavoritesTab")}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={favorite}
                  onClick={() => setFavorite((v) => !v)}
                  className={`w-10 h-6 rounded-full relative flex items-center px-1 cursor-pointer transition-colors shrink-0 ${
                    favorite ? "bg-primary-500" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                  aria-label={favorite ? t("entry.ariaRemoveFavorite") : t("entry.ariaAddFavorite")}
                >
                  <span
                    className={`size-4 bg-white rounded-full shadow-sm block transition-transform ${
                      favorite ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer actions */}
            <div className="mt-4 space-y-4">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-primary-500 text-white font-bold h-14 rounded-lg shadow-md hover:bg-primary-600 disabled:opacity-50 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" aria-hidden />
                {t("entry.savePassword")}
              </button>
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                {t("entry.footerEncrypt")}
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
