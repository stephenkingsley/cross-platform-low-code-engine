import type { CSSProperties, ReactNode } from 'react';
import { SPACING, type SpacingToken } from './tokens';

export type OverlayPlacement = 'top' | 'center' | 'bottom';
export type OverlayAlign = 'start' | 'center' | 'end' | 'stretch';

export interface OverlayProps {
    /**
     * Vertical placement of the content over the media.
     * @default 'bottom'
     */
    placement?: OverlayPlacement;
    /**
     * Horizontal alignment of the content.
     * @default 'start'
     */
    align?: OverlayAlign;
    /**
     * Dark gradient scrim so overlaid text stays legible on photos (and makes
     * descendant text white).
     * @default true
     */
    scrim?: boolean;
    /**
     * Inner padding (spacing token).
     * @default 'md'
     */
    padding?: SpacingToken;
    /**
     * Gap between stacked children (spacing token).
     * @default 'xs'
     */
    gap?: SpacingToken;
    /** Content placed over the media (e.g. a Tag, a DataRow). */
    children?: ReactNode;
}

const PLACE: Record<OverlayPlacement, 'flex-start' | 'center' | 'flex-end'> = {
    top: 'flex-start',
    center: 'center',
    bottom: 'flex-end',
};

const ALIGN: Record<OverlayAlign, 'flex-start' | 'center' | 'flex-end' | 'stretch'> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
};

/**
 * Cross-platform overlay descriptor: absolutely fills the nearest positioned
 * ancestor and flex-anchors its content. Every key here is valid in BOTH web CSS
 * and React Native StyleSheet (absolute + inset + flex), so the same output feeds
 * a DOM `style` or `StyleSheet.create`. No CSS strings.
 */
export interface OverlayStyle {
    position: 'absolute';
    top: number;
    right: number;
    bottom: number;
    left: number;
    display: 'flex';
    flexDirection: 'column';
    justifyContent: 'flex-start' | 'center' | 'flex-end';
    alignItems: 'flex-start' | 'center' | 'flex-end' | 'stretch';
    gap: number;
    padding: number;
}

/** Translate overlay tokens → a cross-platform style descriptor. No CSS strings. */
export function resolveOverlayStyle(props: OverlayProps): OverlayStyle {
    const { placement = 'bottom', align = 'start', gap = 'xs', padding = 'md' } = props;
    return {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: PLACE[placement],
        alignItems: ALIGN[align],
        gap: SPACING[gap],
        padding: SPACING[padding],
    };
}

/**
 * Overlay primitive: lays its children OVER the nearest positioned ancestor — e.g.
 * a Swiper slide's image — so a Tag / caption can sit inside the picture. With
 * `scrim` it paints a bottom-up dark gradient and turns descendant text white for
 * legibility over photos.
 *
 * The layout (absolute fill + flex anchoring) is cross-platform; only the scrim
 * gradient is web-specific (the RN binding swaps in a gradient view), exactly the
 * way Flex/Card abstract their platform output.
 */
export function Overlay(props: OverlayProps) {
    const { scrim = true } = props;
    const style: CSSProperties = {
        ...resolveOverlayStyle(props),
        ...(scrim
            ? {
                  backgroundImage:
                      'linear-gradient(to top, rgba(0,0,0,0.66) 0%, rgba(0,0,0,0.22) 42%, rgba(0,0,0,0) 72%)',
                  color: '#ffffff',
              }
            : null),
    };
    return (
        <div className="lce-overlay" style={style}>
            {props.children}
        </div>
    );
}
