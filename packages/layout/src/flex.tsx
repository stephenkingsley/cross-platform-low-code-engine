import type { CSSProperties, ReactNode } from 'react';
import { SPACING, type SpacingToken } from './tokens';

export type FlexDirection = 'row' | 'column';
export type FlexJustify =
    | 'start'
    | 'center'
    | 'end'
    | 'between'
    | 'around'
    | 'evenly';
export type FlexAlign = 'start' | 'center' | 'end' | 'stretch';

export interface FlexProps {
    /**
     * Main-axis direction.
     * @default 'column'
     */
    direction?: FlexDirection;
    /**
     * Distribution of children along the main axis.
     * @default 'start'
     */
    justify?: FlexJustify;
    /**
     * Alignment of children along the cross axis.
     * @default 'stretch'
     */
    align?: FlexAlign;
    /**
     * Gap between children (spacing token).
     * @default 'none'
     */
    gap?: SpacingToken;
    /**
     * Inner padding (spacing token).
     * @default 'none'
     */
    padding?: SpacingToken;
    /**
     * Allow children to wrap onto multiple lines.
     * @default false
     */
    wrap?: boolean;
    /** Nested content. */
    children?: ReactNode;
    /** Click handler — wired by the runtime from a configured `action` (not a builder field). */
    onClick?: () => void;
}

const JUSTIFY: Record<
    FlexJustify,
    'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
    evenly: 'space-evenly',
};

const ALIGN: Record<FlexAlign, 'flex-start' | 'center' | 'flex-end' | 'stretch'> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
};

/**
 * Platform-agnostic flexbox descriptor. Every key/value here is valid in BOTH web
 * CSS and React Native StyleSheet, so the same translator output can be spread into
 * a DOM `style` (web) or passed to `StyleSheet.create` (native). This is the seam
 * that keeps layout cross-platform without leaking CSS strings.
 */
export interface FlexStyle {
    display: 'flex';
    flexDirection: FlexDirection;
    justifyContent: (typeof JUSTIFY)[FlexJustify];
    alignItems: (typeof ALIGN)[FlexAlign];
    flexWrap: 'wrap' | 'nowrap';
    gap: number;
    padding: number;
}

/** Translate flexbox tokens → a cross-platform style descriptor. No CSS strings. */
export function resolveFlexStyle(props: FlexProps): FlexStyle {
    const {
        direction = 'column',
        justify = 'start',
        align = 'stretch',
        gap = 'none',
        padding = 'none',
        wrap = false,
    } = props;
    return {
        display: 'flex',
        flexDirection: direction,
        justifyContent: JUSTIFY[justify],
        alignItems: ALIGN[align],
        flexWrap: wrap ? 'wrap' : 'nowrap',
        gap: SPACING[gap],
        padding: SPACING[padding],
    };
}

/**
 * Web binding for the Flex primitive: flexbox tokens → DOM style.
 * The React Native binding will reuse {@link resolveFlexStyle} unchanged and feed
 * it to `StyleSheet.create` on a `<View>`.
 */
export function Flex(props: FlexProps) {
    const style: CSSProperties = resolveFlexStyle(props);
    if (props.onClick) style.cursor = 'pointer';
    return (
        <div style={style} onClick={props.onClick}>
            {props.children}
        </div>
    );
}
