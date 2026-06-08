/**
 * Cross-platform design tokens.
 *
 * Values are unitless numbers: the web binding maps them to `px`, the (future)
 * React Native binding maps them to density-independent pixels. Components
 * reference tokens by key, never raw numbers — so a saved document stays
 * platform-agnostic and free of any CSS string.
 */

export type SpacingToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Spacing scale, used for gap / padding. */
export const SPACING: Record<SpacingToken, number> = {
    none: 0,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};

export type SizeToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Font-size scale. */
export const FONT_SIZE: Record<SizeToken, number> = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
};

export type WeightToken = 'regular' | 'medium' | 'bold';

/** Font-weight scale. */
export const FONT_WEIGHT: Record<WeightToken, number> = {
    regular: 400,
    medium: 500,
    bold: 700,
};
