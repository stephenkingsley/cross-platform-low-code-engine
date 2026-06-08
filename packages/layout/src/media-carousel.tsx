import type { CSSProperties } from 'react';
import { MediaCaption, type MediaCaptionProps } from './media-caption';

export interface MediaCarouselItem extends MediaCaptionProps {
    /** Card image URL. */
    src?: string;
}

export interface MediaCarouselProps {
    /** The cards to show. Each is a self-contained image card with an overlaid caption. */
    items?: MediaCarouselItem[];
    /**
     * Each card's width as a % of the viewport — the rest peeks, like a Swiper.
     * @default 86
     */
    cardWidth?: number;
    /**
     * Gap between cards (px).
     * @default 16
     */
    gap?: number;
    /**
     * Card height (px).
     * @default 184
     */
    height?: number;
}

/**
 * Horizontal card carousel — the `<Swiper><Swiper.Item>` pattern as a SELF-CONTAINED
 * builder component. Each card is its own item (rounded, with a `gap` between them);
 * cards come from a scalar `items` array (NOT a slot), so Puck passes plain data and
 * the component renders identically in the editor and the runtime.
 *
 * Uses native scroll-snap (smooth, paged horizontal swipe) rather than antd-mobile's
 * Swiper, because antd-mobile isn't importable here and dp's Swiper ignores children;
 * the visual + UX (peek, snap, gap) match the source lounge/What's-new carousel.
 */
export function MediaCarousel({
    items = [],
    cardWidth = 86,
    gap = 16,
    height = 184,
}: MediaCarouselProps) {
    const row: CSSProperties = {
        display: 'flex',
        gap,
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        padding: '0 16px 6px',
        scrollPaddingLeft: 16,
        scrollbarWidth: 'none',
    };
    return (
        <div className="lce-hscroll" style={row}>
            {items.map((item, i) => (
                <div
                    key={i}
                    style={{
                        position: 'relative',
                        flex: `0 0 ${cardWidth}%`,
                        scrollSnapAlign: 'start',
                        borderRadius: 8,
                        overflow: 'hidden',
                        height,
                    }}
                >
                    <img
                        src={item.src}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <MediaCaption badge={item.badge} title={item.title} description={item.description} />
                </div>
            ))}
        </div>
    );
}
