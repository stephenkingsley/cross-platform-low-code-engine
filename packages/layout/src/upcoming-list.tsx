import type { CSSProperties } from 'react';
import { FONT_FAMILY } from './typography';
import { FONT_WEIGHT, HEADING_SIZE, type HeadingSizeToken, type WeightToken } from './tokens';

export interface UpcomingItem {
    /**
     * Card title (the lounge / service name).
     * @default "Example Lounge"
     */
    title?: string;
    /**
     * Location line.
     * @default "Example Airport (EXA)"
     */
    location?: string;
    /**
     * Date · time line.
     * @default "01 Sep 2026 • 10:30"
     */
    datetime?: string;
    /**
     * Status label.
     * @default "Confirmed"
     */
    status?: string;
    /**
     * Status colour tone.
     * @default "success"
     */
    statusTone?: 'success' | 'warning' | 'neutral';
    /** Thumbnail image. */
    image?: string;
    /** Per-card click action. */
    action?: { type: string; [key: string]: unknown };
    /** Click handler — injected by the runtime from `action` (not a builder field). */
    onClick?: () => void;
}

export interface UpcomingListProps {
    /**
     * Section heading.
     * @default "Upcoming"
     */
    heading?: string;
    /**
     * Heading size preset (sm 14 / md 16 / lg 18 / xl 22).
     * @default 'lg'
     */
    headingSize?: HeadingSizeToken;
    /**
     * Heading weight preset (regular 400 / medium 500 / bold 700).
     * @default 'bold'
     */
    headingWeight?: WeightToken;
    /**
     * Weight of each card's title (regular 400 / medium 500 / bold 700).
     * @default 'regular'
     */
    itemTitleWeight?: WeightToken;
    /**
     * "View all" link text (leave empty to hide it).
     * @default "View all"
     */
    viewAllText?: string;
    /** URL the "View all" link points to. */
    viewAllHref?: string;
    /** The booking cards. */
    items?: UpcomingItem[];
}

const TONE: Record<'success' | 'warning' | 'neutral', { bg: string; fg: string }> = {
    success: { bg: '#E7F6EC', fg: '#1B7F3B' },
    warning: { bg: '#FEF3D7', fg: '#8A6100' },
    neutral: { bg: '#EEF1F4', fg: '#5A6B7E' },
};

const rowStyle: CSSProperties = {
    display: 'flex',
    gap: 12,
    overflowX: 'auto',
    padding: '0 16px 6px',
    scrollSnapType: 'x mandatory',
    // Without this, the mandatory snap aligns card 1 to the scrollport edge on first
    // layout — auto-scrolling by exactly the padding-left and "eating" the margin.
    scrollPaddingLeft: 16,
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
const metaStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#5A6B7E' };

const PinIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flex: 'none' }}>
        <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);
const CalIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flex: 'none' }}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
);

/**
 * «Upcoming» template — a section header (title + count + "View all") above a horizontal
 * row of booking cards (title, location, date/time, status badge, thumbnail). Self-contained
 * (scalar/array props, no slots); each card carries an optional per-card click action.
 */
export function UpcomingList({
    heading = 'Upcoming',
    headingSize = 'lg',
    headingWeight = 'bold',
    itemTitleWeight = 'regular',
    viewAllText = 'View all',
    viewAllHref,
    items = [
        {
            title: 'Example Lounge',
            location: 'Example Airport (EXA)',
            datetime: '01 Sep 2026 • 10:30',
            status: 'Confirmed',
            statusTone: 'success',
        },
    ],
}: UpcomingListProps) {
    return (
        <div style={{ padding: '16px 0', fontFamily: FONT_FAMILY }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px 12px' }}>
                <span style={{ fontSize: HEADING_SIZE[headingSize], fontWeight: FONT_WEIGHT[headingWeight], color: '#0A2333' }}>{heading}</span>
                <span style={{ fontSize: HEADING_SIZE[headingSize], fontWeight: 600, color: '#AFAEAD', marginLeft: 6 }}>{items.length}</span>
                <span style={{ flex: 1 }} />
                {viewAllText ? (
                    <a
                        href={viewAllHref || undefined}
                        style={{ fontSize: 14, fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}
                    >
                        {viewAllText}
                    </a>
                ) : null}
            </div>
            <div className="lce-hscroll" style={rowStyle}>
                {items.map((it, i) => {
                    const t = TONE[it.statusTone ?? 'success'];
                    return (
                        <div key={i} onClick={it.onClick} style={{ ...cardStyle, cursor: it.onClick ? 'pointer' : undefined }}>
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ fontSize: 16, fontWeight: FONT_WEIGHT[itemTitleWeight], color: '#0A2333' }}>{it.title}</div>
                                {it.location ? (
                                    <div style={metaStyle}>
                                        <PinIcon />
                                        {it.location}
                                    </div>
                                ) : null}
                                {it.datetime ? (
                                    <div style={metaStyle}>
                                        <CalIcon />
                                        {it.datetime}
                                    </div>
                                ) : null}
                                {it.status ? (
                                    <span
                                        style={{
                                            alignSelf: 'flex-start',
                                            marginTop: 2,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            padding: '3px 10px',
                                            borderRadius: 100,
                                            background: t.bg,
                                            color: t.fg,
                                        }}
                                    >
                                        {it.status}
                                    </span>
                                ) : null}
                            </div>
                            {it.image ? (
                                <img
                                    src={it.image}
                                    alt=""
                                    style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 10, flex: 'none' }}
                                />
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
