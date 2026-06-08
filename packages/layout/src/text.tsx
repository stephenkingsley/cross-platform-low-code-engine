import type { CSSProperties } from 'react';
import { FONT_SIZE, FONT_WEIGHT, type SizeToken, type WeightToken } from './tokens';

export type TextAlign = 'start' | 'center' | 'end';

export interface TextProps {
    /**
     * Text content. Typed as `string` (not ReactNode) so the builder exposes it as
     * a plain text field rather than a nesting slot.
     * @default 'Text'
     */
    children?: string;
    /**
     * Font size (size token).
     * @default 'md'
     */
    size?: SizeToken;
    /**
     * Font weight.
     * @default 'regular'
     */
    weight?: WeightToken;
    /**
     * Horizontal text alignment.
     * @default 'start'
     */
    align?: TextAlign;
}

const TEXT_ALIGN: Record<TextAlign, 'left' | 'center' | 'right'> = {
    start: 'left',
    center: 'center',
    end: 'right',
};

/** Cross-platform text style descriptor (valid in web CSS and RN StyleSheet). */
export interface TextStyle {
    fontSize: number;
    fontWeight: number;
    textAlign: 'left' | 'center' | 'right';
}

/** Translate text tokens → a cross-platform style descriptor. */
export function resolveTextStyle(props: TextProps): TextStyle {
    const { size = 'md', weight = 'regular', align = 'start' } = props;
    return {
        fontSize: FONT_SIZE[size],
        fontWeight: FONT_WEIGHT[weight],
        textAlign: TEXT_ALIGN[align],
    };
}

/**
 * Web binding for the Text primitive. The React Native binding will reuse
 * {@link resolveTextStyle} and render an RN `<Text>`.
 */
export function Text(props: TextProps) {
    const style: CSSProperties = resolveTextStyle(props);
    return <span style={style}>{props.children ?? ''}</span>;
}
