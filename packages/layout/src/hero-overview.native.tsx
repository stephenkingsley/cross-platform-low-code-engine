/**
 * React Native binding for HeroOverview — SAME props as `hero-overview.tsx`. The
 * full-bleed banner + title/subtitle/description stack rendered with RN primitives;
 * Typography resolves to its `.native` binding so the type scale matches the web.
 *
 *   web (hero-overview.tsx)        native (this file)
 *   ─────────────────────────      ────────────────────────────
 *   <img object-fit:cover>         <Image resizeMode="cover">
 *   <div> flex column + gap        <View> flex column + gap
 *   <Typography> (web)             <Typography> → resolves to .native
 */
import { View, Image } from 'react-native';
import { Typography } from './typography';
import type { HeroOverviewProps } from './hero-overview';

export function HeroOverview({
    image,
    title = 'Enjoy your Travel in China',
    subtitle = 'valid for 1 year | Refundable',
    description = 'Your all-in-one pass to Beijing. Pick from xx+ attractions & experience. Bundle together and save up to 50%.',
    height = 220,
}: HeroOverviewProps) {
    return (
        <View style={{ backgroundColor: '#fff' }}>
            {image ? (
                <Image source={{ uri: image }} resizeMode="cover" style={{ width: '100%', height }} />
            ) : null}
            <View style={{ padding: 16, gap: 8, alignItems: 'flex-start' }}>
                {title ? <Typography variant="title" text={title} /> : null}
                {subtitle ? <Typography variant="subtitle" text={subtitle} /> : null}
                {description ? <Typography variant="body" text={description} /> : null}
            </View>
        </View>
    );
}
