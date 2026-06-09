import type { CSSProperties } from 'react';
import { MediaCarousel, type MediaCarouselItem } from './media-carousel';
import { Typography } from './typography';

export interface WhatsNewProps {
    /**
     * Section heading.
     * @default "What's new"
     */
    heading?: string;
    /** The cards in the carousel (image + badge + title + description each). */
    items?: MediaCarouselItem[];
}

const headStyle: CSSProperties = { padding: '16px 16px 12px' };

/**
 * «What's new» template — a section heading above a horizontal card carousel. A
 * self-contained module composing Typography + MediaCarousel, so ops drop it once and edit
 * the heading + cards. Renders identically in the editor and the Puck-free runtime.
 */
export function WhatsNew({
    heading = "What's new",
    items = [
        {
            src: 'https://picsum.photos/seed/dpnews1/460/280',
            badge: 'News',
            title: 'Our network is growing',
            description: 'More airports, more ways to simplify your travel.',
        },
        {
            src: 'https://picsum.photos/seed/dpnews2/460/280',
            badge: 'Product',
            title: 'Faster lounge check-in',
            description: 'Scan once at the door and walk straight in.',
        },
    ],
}: WhatsNewProps) {
    return (
        <div>
            <div style={headStyle}>
                <Typography variant="title" text={heading} />
            </div>
            <MediaCarousel items={items} />
        </div>
    );
}
