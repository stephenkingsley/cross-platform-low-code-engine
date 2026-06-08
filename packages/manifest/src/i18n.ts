/**
 * Internationalisation for document content.
 *
 * A translatable text value is a {@link LocalizedString}: either a plain string
 * (one language) or a map of `locale → string`. The document carries every language;
 * the runtime/editor resolve it to the active locale at render time. Plain strings
 * keep working unchanged (single-language / not-yet-translated), so this is fully
 * backward-compatible.
 */

export type LocalizedString = string | { [locale: string]: string };

/**
 * Resolve a possibly-localized text value to a string for `locale`.
 * Order: exact locale → `fallback` locale → first available string → the value as-is.
 * Non-localized values (plain strings, numbers, etc.) pass through unchanged.
 *
 * Only call this for values that are meant to be text (the caller knows the field is
 * a `text`/`textarea`), so a map is unambiguously a locale→string table.
 */
export function resolveLocalized(value: unknown, locale?: string, fallback?: string): unknown {
    if (value == null || typeof value !== 'object' || Array.isArray(value)) return value;
    const map = value as Record<string, unknown>;
    if (locale && typeof map[locale] === 'string') return map[locale];
    if (fallback && typeof map[fallback] === 'string') return map[fallback];
    for (const v of Object.values(map)) if (typeof v === 'string') return v;
    return value;
}

/** True when a value is a locale→string map (vs a plain string). */
export function isLocalizedMap(value: unknown): value is Record<string, string> {
    return (
        value != null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.values(value as Record<string, unknown>).every((v) => typeof v === 'string')
    );
}
