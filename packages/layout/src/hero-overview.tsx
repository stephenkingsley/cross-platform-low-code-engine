import type { CSSProperties } from 'react';
import { Typography } from './typography';

export interface HeroOverviewProps {
    /** Hero image — the full-width banner at the top. */
    image?: string;
    /**
     * Main heading.
     * @default "Enjoy your Travel in China"
     */
    title?: string;
    /**
     * Secondary line under the title.
     * @default "valid for 1 year | Refundable"
     */
    subtitle?: string;
    /**
     * Body copy under the subtitle.
     * @default "Your all-in-one pass to Beijing. Pick from xx+ attractions & experience. Bundle together and save up to 50%."
     */
    description?: string;
    /**
     * Hero image height (px).
     * @default 220
     */
    height?: number;
}

const wrap: CSSProperties = { background: '#fff' };
const body: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-start',
    padding: 16,
};

/**
 * «顶部概览区» template — a full-bleed hero image with a title / subtitle / description
 * stack styled on dp-design's type scale. A self-contained module (scalar props, no slots),
 * so ops drop it once and fill four fields instead of composing image + 3 Typography blocks
 * by hand. Renders identically in the editor and the Puck-free runtime.
 */
export function HeroOverview({
    image,
    title = 'Enjoy your Travel in China',
    subtitle = 'valid for 1 year | Refundable',
    description = 'Your all-in-one pass to Beijing. Pick from xx+ attractions & experience. Bundle together and save up to 50%.',
    height = 220,
}: HeroOverviewProps) {
    return (
        <div style={wrap}>
            {image ? (
                <img src={image} alt="" style={{ width: '100%', height, objectFit: 'cover', display: 'block' }} />
            ) : null}
            <div style={body}>
                {title ? <Typography variant="title" text={title} /> : null}
                {subtitle ? <Typography variant="subtitle" text={subtitle} /> : null}
                {description ? <Typography variant="body" text={description} /> : null}
            </div>
        </div>
    );
}
