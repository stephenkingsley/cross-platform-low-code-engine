/**
 * Ops-facing vocabulary for token VALUES.
 *
 * Keyed by TOKEN SCALE, not by component: dp-design and pandora-box-layout share one
 * scale, so `md` means the same thing on every component that spends it and a single
 * table covers ~100 of them. Per-component authoring would be ~100 copies of one map.
 *
 * Used ONLY by the ops-facing read-only "Looks" gloss. DESIGN mode keeps tokens raw —
 * `md`/`lg` is the designer's Figma vocabulary, and glossing it there would break the
 * shared language between the panel and the design file.
 *
 * This is presentation metadata. It never reaches the saved document.
 */

/** Token scales that carry an ops-facing gloss. */
export type TokenScale = 'spacing' | 'radius';

export const VALUE_LABELS: Record<TokenScale, Record<string, string>> = {
    spacing: {
        none: 'None',
        xs: 'Very tight',
        sm: 'Tight',
        md: 'Comfortable',
        lg: 'Roomy',
        xl: 'Very roomy',
    },
    radius: {
        none: 'Square',
        xs: 'Barely round',
        sm: 'Slightly round',
        md: 'Round',
        lg: 'Very round',
        xl: 'Fully round',
    },
};

/**
 * Pick a scale from the prop name. Matched as a case-insensitive SUBSTRING, not a prefix:
 * real prop names are compound (`borderRadius`, `contentPadding`, `itemGap`, `bubblePadding`),
 * and in dp-design `borderRadius` outnumbers bare `radius` ~250:1 — a prefix match would
 * miss nearly the whole scale.
 *
 * `radius` is tested first; no name carries both markers.
 */
function scaleOf(fieldName: string): TokenScale | undefined {
    const n = fieldName.toLowerCase();
    if (n.includes('radius')) return 'radius';
    if (n.includes('padding') || n.includes('gap') || n.includes('margin')) return 'spacing';
    return undefined;
}

/**
 * Gloss a token value for ops.
 *
 * Safe to call on any field: non-token props, off-scale values (`12`, `'0.5px'`) and
 * unrecognised tokens fall back to the raw value. `null`/`undefined` yield `''` — an unset
 * prop has nothing to gloss, and the caller owns the placeholder.
 */
export function humanizeValue(fieldName: string, value: unknown): string {
    if (value == null) return '';
    const scale = scaleOf(fieldName);
    if (scale && typeof value === 'string') {
        const label = VALUE_LABELS[scale][value];
        if (label) return label;
    }
    return String(value);
}
