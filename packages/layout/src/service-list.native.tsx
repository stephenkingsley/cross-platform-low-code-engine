/**
 * React Native binding for ServiceList — SAME props as `service-list.tsx`, rendered
 * with RN primitives. The horizontal card row uses `<ScrollView horizontal>` with
 * snapping (web: overflow-x:auto + scroll-snap); the web `boxShadow` string becomes
 * RN shadow props / `elevation`; the per-card `onClick` (injected by the runtime from
 * the document `action`) maps to `<Pressable onPress>`.
 *
 *   web (service-list.tsx)              native (this file)
 *   ───────────────────────────────    ────────────────────────────────────
 *   <div> overflow-x:auto scroll-snap  <ScrollView horizontal> + snapToInterval
 *   flex: 0 0 86%                       width: (screenWidth-32) * 0.86
 *   <img object-fit:cover>             <Image resizeMode="cover">
 *   onClick                            <Pressable onPress>
 *   text-decoration: line-through      textDecorationLine: 'line-through'
 */
import { ScrollView, View, Text, Image, Pressable, StyleSheet, Platform, Dimensions } from 'react-native';
import type { ServiceListProps } from './service-list';

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
    const cardWidth = (Dimensions.get('window').width - 32) * 0.86; // flex: 0 0 86%
    return (
        <View style={{ paddingVertical: 16 }}>
            <Text style={styles.heading}>{heading}</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={cardWidth + 12}
                snapToAlignment="start"
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
                {items.map((it, i) => (
                    <Pressable key={i} onPress={it.onClick} style={[styles.card, { width: cardWidth }]}>
                        <View style={{ flex: 1, gap: 5 }}>
                            <Text style={styles.title}>{it.title}</Text>
                            {it.description ? <Text style={styles.desc}>{it.description}</Text> : null}
                            <View style={styles.priceRow}>
                                {it.price ? <Text style={styles.price}>{it.price}</Text> : null}
                                {it.originalPrice ? <Text style={styles.original}>{it.originalPrice}</Text> : null}
                            </View>
                            {it.ctaText ? <Text style={styles.cta}>{it.ctaText}</Text> : null}
                        </View>
                        {it.image ? <Image source={{ uri: it.image }} resizeMode="cover" style={styles.thumb} /> : null}
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    heading: { fontSize: 18, fontWeight: '700', color: '#0A2333', paddingHorizontal: 16, paddingBottom: 12 },
    card: {
        flexDirection: 'row',
        gap: 12,
        padding: 14,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#EEF1F4',
        borderRadius: 14,
        ...Platform.select({
            ios: { shadowColor: '#0a2333', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
            android: { elevation: 3 },
            default: {},
        }),
    },
    title: { fontSize: 16, fontWeight: '700', color: '#0A2333' },
    desc: { fontSize: 13, color: '#5A6B7E', lineHeight: 18 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 },
    price: { fontSize: 18, fontWeight: '700', color: '#0A2333' },
    original: { fontSize: 14, color: '#AFAEAD', textDecorationLine: 'line-through' },
    cta: { marginTop: 4, fontSize: 14, fontWeight: '600', color: '#2563EB' },
    thumb: { width: 84, height: 84, borderRadius: 10, alignSelf: 'center' },
});
