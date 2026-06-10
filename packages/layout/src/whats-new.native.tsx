/**
 * React Native binding for WhatsNew — SAME props as `whats-new.tsx`. Composes the
 * native Typography + MediaCarousel (Metro resolves each sibling to its `.native`
 * binding), so the saved document renders the identical heading + card carousel on
 * native that the web binding renders in the browser.
 *
 *   web (whats-new.tsx)        native (this file)
 *   ─────────────────────      ────────────────────────────────
 *   <div> + CSS padding        <View> + StyleSheet padding
 *   <Typography> (web)         <Typography> → resolves to .native
 *   <MediaCarousel> (web)      <MediaCarousel> → resolves to .native
 */
import { View } from 'react-native';
import { Typography } from './typography';
import { MediaCarousel } from './media-carousel';
import type { WhatsNewProps } from './whats-new';

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
        <View>
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
                <Typography variant="title" text={heading} />
            </View>
            <MediaCarousel items={items} />
        </View>
    );
}
