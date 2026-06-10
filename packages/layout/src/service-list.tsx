import type { CSSProperties } from 'react';

export interface ServiceItem {
    /**
     * Service title.
     * @default "Fast Track"
     */
    title?: string;
    /**
     * Short description.
     * @default "More airports, more ways to simplify your travel."
     */
    description?: string;
    /**
     * Current price.
     * @default "$20"
     */
    price?: string;
    /**
     * Original (struck-through) price.
     * @default "$36"
     */
    originalPrice?: string;
    /**
     * Call-to-action link text.
     * @default "Book now"
     */
    ctaText?: string;
    /** Thumbnail image. */
    image?: string;
    /** Per-card click action (the CTA / whole card). */
    action?: { type: string; [key: string]: unknown };
    /** Click handler — injected by the runtime from `action` (not a builder field). */
    onClick?: () => void;
}

export interface ServiceListProps {
    /**
     * Section heading.
     * @default "Available Services"
     */
    heading?: string;
    /** The service cards. */
    items?: ServiceItem[];
}

const rowStyle: CSSProperties = {
    display: 'flex',
    gap: 12,
    overflowX: 'auto',
    padding: '0 16px 6px',
    scrollSnapType: 'x mandatory',
    scrollbarWidth: 'none',
};
const cardStyle: CSSProperties = {
    flex: '0 0 86%',
    scrollSnapAlign: 'start',
    display: 'flex',
    gap: 12,
    padding: 14,
    background: '#fff',
    border: '1px solid #EEF1F4',
    borderRadius: 14,
    boxShadow: '0 2px 10px rgba(10, 35, 51, 0.05)',
    boxSizing: 'border-box',
};

/**
 * «Available Services» template — a heading above a horizontal row of service cards
 * (title, description, price + struck-through original price, CTA link, thumbnail).
 * Self-contained; each card carries an optional per-card click action (the CTA).
 */
export function ServiceList({
    heading = 'Available Services',
    items = [
        {
            title: 'Fast Track',
            description: 'More airports, more ways to simplify your travel.',
            price: '$20',
            originalPrice: '$36',
            ctaText: 'Book now',
        },
    ],
}: ServiceListProps) {
    return (
        <div style={{ padding: '16px 0' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0A2333', padding: '0 16px 12px' }}>{heading}</div>
            <div className="lce-hscroll" style={rowStyle}>
                {items.map((it, i) => (
                    <div key={i} onClick={it.onClick} style={{ ...cardStyle, cursor: it.onClick ? 'pointer' : undefined }}>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#0A2333' }}>{it.title}</div>
                            {it.description ? (
                                <div style={{ fontSize: 13, color: '#5A6B7E', lineHeight: 1.4 }}>{it.description}</div>
                            ) : null}
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
                                {it.price ? <span style={{ fontSize: 18, fontWeight: 700, color: '#0A2333' }}>{it.price}</span> : null}
                                {it.originalPrice ? (
                                    <span style={{ fontSize: 14, color: '#AFAEAD', textDecoration: 'line-through' }}>{it.originalPrice}</span>
                                ) : null}
                            </div>
                            {it.ctaText ? (
                                <span style={{ marginTop: 4, fontSize: 14, fontWeight: 600, color: '#2563EB' }}>{it.ctaText}</span>
                            ) : null}
                        </div>
                        {it.image ? (
                            <img
                                src={it.image}
                                alt=""
                                style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 10, flex: 'none', alignSelf: 'center' }}
                            />
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
}
