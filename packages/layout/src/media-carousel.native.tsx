/**
 * React Native binding for MediaCarousel — SAME props as `media-carousel.tsx`,
 * rendered with RN primitives. The saved document only carries platform-agnostic
 * props (`items`, `cardWidth`, `gap`, `height`), so this renders the identical card
 * carousel on native that the web binding renders in the browser.
 *
 *   web (media-carousel.tsx)              native (this file)
 *   ───────────────────────────────      ────────────────────────────────────
 *   <div> overflow-x:auto + scroll-snap  <ScrollView horizontal> + snapToInterval
 *   flex: 0 0 cardWidth%                 width: (screenWidth-32) * cardWidth/100
 *   <img object-fit:cover>               <Image resizeMode="cover">
 *   onClick (card)                       <Pressable onPress>
 *   <MediaCaption> (web)                 <MediaCaption> → resolves to .native here
 */
import { ScrollView, Image, Pressable, StyleSheet, Dimensions } from 'react-native';
import { MediaCaption } from './media-caption';
import type { MediaCarouselProps } from './media-carousel';

export function MediaCarousel({
    items = [],
    cardWidth = 86,
    gap = 16,
    height = 184,
}: MediaCarouselProps) {
    const screenWidth = Dimensions.get('window').width;
    // % of the viewport → px, the cross-platform translation of `flex: 0 0 cardWidth%`.
    const w = ((screenWidth - 32) * cardWidth) / 100;
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={w + gap}
            snapToAlignment="start"
            contentContainerStyle={{ paddingHorizontal: 16, gap }}
        >
            {items.map((item, i) => (
                <Pressable
                    key={i}
                    onPress={item.onClick}
                    style={{ width: w, height, borderRadius: 8, overflow: 'hidden' }}
                >
                    <Image
                        source={{ uri: item.src }}
                        resizeMode="cover"
                        style={StyleSheet.absoluteFill}
                    />
                    <MediaCaption badge={item.badge} title={item.title} description={item.description} />
                </Pressable>
            ))}
        </ScrollView>
    );
}
