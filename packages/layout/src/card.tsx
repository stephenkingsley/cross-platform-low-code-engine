import type { CSSProperties, ReactNode } from 'react';
import { SPACING, type SpacingToken } from './tokens';

export type RadiusToken = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
    /**
     * Inner padding (spacing token).
     * @default 'md'
     */
    padding?: SpacingToken;
    /**
     * Corner radius.
     * @default 'md'
     */
    radius?: RadiusToken;
    /**
     * Show a soft drop shadow.
     * @default true
     */
    shadow?: boolean;
    /** Nested content. */
    children?: ReactNode;
    /** Click handler — wired by the runtime from a configured `action` (not a builder field). */
    onClick?: () => void;
}

const RADIUS: Record<RadiusToken, number> = { none: 0, sm: 8, md: 12, lg: 20 };

/**
 * A simple visual container — a padded, rounded surface to group nested components.
 * (Engine layout primitive; dp-design has no plain container.)
 */
export function Card(props: CardProps) {
    const { padding = 'md', radius = 'md', shadow = true, children, onClick } = props;
    const style: CSSProperties = {
        padding: SPACING[padding],
        borderRadius: RADIUS[radius],
        background: '#ffffff',
        border: '1px solid #eef1f4',
        boxShadow: shadow ? '0 2px 10px rgba(10, 35, 51, 0.06)' : 'none',
    };
    if (onClick) style.cursor = 'pointer';
    return (
        <div style={style} onClick={onClick}>
            {children}
        </div>
    );
}
