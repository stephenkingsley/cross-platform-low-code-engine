import type { CSSProperties } from 'react';

/** Typographic roles, mapped 1:1 to dp-design's type scale + foreground colours. */
export type TypographyVariant = 'title' | 'subtitle' | 'body' | 'caption';
export type TypographyAlign = 'left' | 'center' | 'right';

export interface TypographyProps {
    /** The text to render. */
    text?: string;
    /**
     * Typographic role — maps to dp-design's seed tokens (size / line-height /
     * weight / colour), so text matches the design system without ad-hoc styles.
     * @default 'body'
     */
    variant?: TypographyVariant;
    /**
     * Horizontal alignment.
     * @default 'left'
     */
    align?: TypographyAlign;
    /**
     * Clamp to at most N lines with an ellipsis (0 = no clamp).
     * @default 0
     */
    maxLines?: number;
}

/**
 * dp-design seed tokens (mobile): textSize Xlg=18 / Default=14 / Sm=12, lineHeight
 * Xlg=28 / Default=20 / Sm=18, colours fgEmphasis #0A2333, fgPrimary #4B4A4A,
 * fgSecondary #737272, fgTertiary #AFAEAD. Kept here so the builder renders text in
 * the design-system's exact scale (dp's own `Text` is skeleton-only, no styling).
 */
const VARIANT: Record<
    TypographyVariant,
    { fontSize: number; lineHeight: number; fontWeight: number; color: string }
> = {
    title: { fontSize: 18, lineHeight: 28, fontWeight: 700, color: '#0A2333' },
    subtitle: { fontSize: 14, lineHeight: 20, fontWeight: 500, color: '#4B4A4A' },
    body: { fontSize: 14, lineHeight: 20, fontWeight: 400, color: '#737272' },
    caption: { fontSize: 12, lineHeight: 18, fontWeight: 400, color: '#AFAEAD' },
};

const FONT_FAMILY = "'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif";

/**
 * Styled text primitive built on dp-design's typography tokens. `text` is a scalar
 * prop (not a slot), so the component is self-contained — it renders identically in
 * the Puck editor and the Puck-free runtime, with no DropZone-wrapper interference.
 *
 * fontSize / fontWeight / color / textAlign are all valid in web CSS and RN, so the
 * RN binding reuses the same variant table (line-clamp differs: -webkit-line-clamp
 * on web, numberOfLines on native).
 */
export function Typography(props: TypographyProps) {
    const { text, variant = 'body', align = 'left', maxLines = 0 } = props;
    const v = VARIANT[variant];
    const style: CSSProperties = {
        margin: 0,
        fontFamily: FONT_FAMILY,
        fontSize: v.fontSize,
        lineHeight: `${v.lineHeight}px`,
        fontWeight: v.fontWeight,
        color: v.color,
        textAlign: align,
    };
    if (maxLines > 0) {
        style.display = '-webkit-box';
        style.WebkitLineClamp = maxLines;
        style.WebkitBoxOrient = 'vertical';
        style.overflow = 'hidden';
    }
    return <div style={style}>{text}</div>;
}
