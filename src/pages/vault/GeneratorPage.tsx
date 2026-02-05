import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Lock,
  X,
  RefreshCw,
  Copy,
  History,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import {
  generatePassword,
  getPasswordStrength,
  getStrengthBarColorClass,
  getStrengthTextColorClass,
  LENGTH_MAX,
  LENGTH_MIN,
  type GeneratePasswordOptions,
  type PasswordStrength,
} from "@/lib/password-generator";
import { useClipboard } from "@/hooks/useClipboard";
import { useSettingsStore } from "@/stores/settings-store";

const RECENT_MAX = 10;

interface RecentEntry {
  id: string;
  password: string;
  createdAt: Date;
}

function strengthColor(strength: PasswordStrength): string {
  return getStrengthBarColorClass(strength);
}

function strengthTextColor(strength: PasswordStrength): string {
  return getStrengthTextColorClass(strength);
}

function formatTimeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min === 1) return "1 min ago";
  if (min < 60) return `${min} mins ago`;
  const h = Math.floor(min / 60);
  if (h === 1) return "1 hour ago";
  return `${h} hours ago`;
}

export default function GeneratorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { copy } = useClipboard();

  const defaultLength = useSettingsStore((s) => s.defaultPasswordLength);
  const includeUppercase = useSettingsStore((s) => s.includeUppercase);
  const includeLowercase = useSettingsStore((s) => s.includeLowercase);
  const includeNumbers = useSettingsStore((s) => s.includeNumbers);
  const includeSymbols = useSettingsStore((s) => s.includeSymbols);
  const excludeAmbiguous = useSettingsStore((s) => s.excludeAmbiguousCharacters);
  const allowDuplicate = useSettingsStore((s) => s.allowDuplicateCharacters);
  const setDefaultPasswordLength = useSettingsStore((s) => s.setDefaultPasswordLength);
  const setIncludeUppercase = useSettingsStore((s) => s.setIncludeUppercase);
  const setIncludeLowercase = useSettingsStore((s) => s.setIncludeLowercase);
  const setIncludeNumbers = useSettingsStore((s) => s.setIncludeNumbers);
  const setIncludeSymbols = useSettingsStore((s) => s.setIncludeSymbols);
  const setExcludeAmbiguousCharacters = useSettingsStore(
    (s) => s.setExcludeAmbiguousCharacters
  );
  const setAllowDuplicateCharacters = useSettingsStore(
    (s) => s.setAllowDuplicateCharacters
  );

  const [length, setLength] = useState(defaultLength);
  const [uppercase, setUppercase] = useState(includeUppercase);
  const [lowercase, setLowercase] = useState(includeLowercase);
  const [numbers, setNumbers] = useState(includeNumbers);
  const [symbols, setSymbols] = useState(includeSymbols);
  const [excludeAmbiguousLocal, setExcludeAmbiguousLocal] =
    useState(excludeAmbiguous);
  const [allowDuplicateLocal, setAllowDuplicateLocal] = useState(allowDuplicate);
  const [password, setPassword] = useState("");
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const options: GeneratePasswordOptions = useMemo(
    () => ({
      length,
      includeUppercase: uppercase,
      includeLowercase: lowercase,
      includeNumbers: numbers,
      includeSymbols: symbols,
      excludeAmbiguousCharacters: excludeAmbiguousLocal,
      allowDuplicateCharacters: allowDuplicateLocal,
    }),
    [
      length,
      uppercase,
      lowercase,
      numbers,
      symbols,
      excludeAmbiguousLocal,
      allowDuplicateLocal,
    ]
  );

  const doGenerate = useCallback(() => {
    try {
      const next = generatePassword(options);
      setPassword(next);
      return next;
    } catch {
      setPassword("");
      return "";
    }
  }, [options]);

  useEffect(() => {
    queueMicrotask(() => {
      doGenerate();
    });
  }, [doGenerate]);

  const handleRegenerate = () => {
    const next = doGenerate();
    if (next) {
      setRecent((prev) => [
        { id: crypto.randomUUID(), password: next, createdAt: new Date() },
        ...prev.slice(0, RECENT_MAX - 1),
      ]);
    }
  };

  const handleCopy = async () => {
    if (!password) return;
    const ok = await copy(password);
    setCopySuccess(ok);
    if (ok) setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleUsePassword = () => {
    if (password) {
      setRecent((prev) => [
        { id: crypto.randomUUID(), password, createdAt: new Date() },
        ...prev.filter((e) => e.password !== password).slice(0, RECENT_MAX - 1),
      ]);
      navigate("/entry/new", { state: { generatedPassword: password } });
    }
  };

  const strength = password ? getPasswordStrength(password) : null;

  const canGenerate =
    uppercase || lowercase || numbers || symbols;

  return (
    <div className="min-h-screen pb-24 flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="flex flex-col h-full max-h-[calc(100vh-8rem)] max-w-[840px] w-full bg-white dark:bg-slate-800 shadow-xl rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-primary-500">
            <Lock className="w-8 h-8" aria-hidden />
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-tight text-content-heading dark:text-white">
            {t("generator.title")}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate("/vault")}
          className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-200 dark:bg-slate-600 text-content-heading dark:text-white hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
          aria-label={t("generator.ariaClose")}
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="p-6 space-y-6 overflow-auto flex-1">
        <div className="relative">
          <div
            className="flex flex-col items-center justify-center rounded-xl bg-primary-500 p-8 text-center shadow-lg relative overflow-hidden"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          >
            <p
              className="text-white font-mono text-2xl md:text-3xl font-bold tracking-wider mb-4 relative z-10 break-all"
              aria-live="polite"
            >
              {password || "—"}
            </p>
            <div className="flex gap-2 relative z-10">
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={!canGenerate}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white rounded-lg transition-colors backdrop-blur-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium">{t("generator.regenerate")}</span>
              </button>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!password}
                className="flex items-center gap-2 px-4 py-2 bg-white text-primary-500 hover:bg-white/90 rounded-lg transition-colors shadow-sm font-bold disabled:opacity-50"
              >
                <Copy className="w-4 h-4" />
                <span className="text-sm">{copySuccess ? t("generator.copied") : t("generator.copy")}</span>
              </button>
            </div>
          </div>
          {strength && (
            <div className="flex items-center justify-center mt-4 gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-8 rounded-full ${
                      i <= strength.bars ? strengthColor(strength) : "bg-slate-200 dark:bg-slate-600"
                    }`}
                  />
                ))}
              </div>
              <span
                className={`text-sm font-semibold ${strengthTextColor(strength)}`}
              >
                {strength.label}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-content-muted dark:text-slate-400 px-1">
            {t("generator.settings")}
          </h3>
          <div className="bg-surface dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-content-heading dark:text-white text-base font-medium">
                {t("generator.passwordLength")}
              </p>
              <span className="px-3 py-1 bg-primary-500/10 text-primary-500 rounded-lg font-bold text-sm">
                {length}
              </span>
            </div>
            <div className="flex h-6 w-full items-center gap-4">
              <input
                type="range"
                min={LENGTH_MIN}
                max={LENGTH_MAX}
                value={length}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setLength(v);
                  setDefaultPasswordLength(v);
                }}
                className="w-full h-1.5 rounded-full appearance-none bg-slate-300 dark:bg-slate-600 cursor-pointer accent-primary-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary-500"
                aria-label={t("entry.ariaLength")}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-content-muted font-medium">
              <span>{LENGTH_MIN}</span>
              <span>{LENGTH_MAX}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                label: t("entry.uppercase"),
                value: uppercase,
                set: setUppercase,
                sync: setIncludeUppercase,
              },
              {
                label: t("entry.lowercase"),
                value: lowercase,
                set: setLowercase,
                sync: setIncludeLowercase,
              },
              {
                label: t("entry.numbers"),
                value: numbers,
                set: setNumbers,
                sync: setIncludeNumbers,
              },
              {
                label: t("entry.symbols"),
                value: symbols,
                set: setSymbols,
                sync: setIncludeSymbols,
              },
              {
                label: t("entry.excludeAmbiguous"),
                value: excludeAmbiguousLocal,
                set: setExcludeAmbiguousLocal,
                sync: setExcludeAmbiguousCharacters,
              },
              {
                label: t("entry.allowDuplicate"),
                value: allowDuplicateLocal,
                set: setAllowDuplicateLocal,
                sync: setAllowDuplicateCharacters,
              },
            ].map(({ label, value, set, sync }) => (
              <div
                key={label}
                className="flex items-center justify-between p-3 bg-surface dark:bg-slate-800 rounded-lg"
              >
                <span className="text-sm font-medium text-content-heading dark:text-white">
                  {label}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={value}
                  onClick={() => {
                    const next = !value;
                    set(next);
                    sync(next);
                  }}
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

        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-content-muted dark:text-slate-400 px-1">
            {t("generator.recent")}
          </h3>
          <div className="space-y-2">
            {recent.length === 0 ? (
              <p className="text-sm text-content-muted py-2">{t("generator.noRecent")}</p>
            ) : (
              recent.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-surface dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <History className="w-5 h-5 shrink-0 text-content-muted" />
                    <span className="font-mono text-content-muted tracking-widest truncate">
                      {revealedId === entry.id ? entry.password : "••••••••••••"}
                    </span>
                    <span className="text-xs text-content-muted shrink-0 ml-1">
                      {formatTimeAgo(entry.createdAt)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setRevealedId((id) => (id === entry.id ? null : entry.id))
                    }
                    className="shrink-0 p-1 text-content-muted hover:text-primary-500 transition-colors"
                    aria-label={revealedId === entry.id ? t("generator.ariaHide") : t("generator.ariaReveal")}
                  >
                    {revealedId === entry.id ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="p-6 pt-0 shrink-0">
        <button
          type="button"
          onClick={handleUsePassword}
          disabled={!password}
          className="w-full flex items-center justify-center gap-2 h-14 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl text-base font-bold transition-all shadow-lg shadow-primary-500/20"
        >
          <CheckCircle className="w-5 h-5" />
          {t("generator.useThisPassword")}
        </button>
      </div>
    </div>
    </div>
  );
}
