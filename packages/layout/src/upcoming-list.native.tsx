/**
 * React Native binding for UpcomingList — SAME props as `upcoming-list.tsx`, rendered
 * with RN primitives. Header (title + count + "View all") above a horizontal row of
 * booking cards (title, location, date/time, status badge, thumbnail). The web inline
 * SVG pin/calendar icons become `react-native-svg`; the per-card `onClick` (injected by
 * the runtime from the document `action`) maps to `<Pressable onPress>`. The "View all"
 * link renders as static text (the web `viewAllHref` <a> has no RN navigator equivalent
 * here; a host can wrap it later).
 *
 *   web (upcoming-list.tsx)            native (this file)
 *   ───────────────────────────────    ────────────────────────────────────
 *   <div> overflow-x:auto scroll-snap  <ScrollView horizontal> + snapToInterval
 *   inline <svg> pin / calendar        <Svg> from react-native-svg
 *   onClick                            <Pressable onPress>
 */
import { ScrollView, View, Text, Image, Pressable, StyleSheet, Platform, Dimensions } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import type { UpcomingListProps } from './upcoming-list';

const TONE: Record<'success' | 'warning' | 'neutral', { bg: string; fg: string }> = {
    success: { bg: '#E7F6EC', fg: '#1B7F3B' },
    warning: { bg: '#FEF3D7', fg: '#8A6100' },
    neutral: { bg: '#EEF1F4', fg: '#5A6B7E' },
};

const PinIcon = () => (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#5A6B7E" strokeWidth={2}>
        <Path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" />
        <Circle cx={12} cy={10} r={3} />
    </Svg>
);
const CalIcon = () => (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#5A6B7E" strokeWidth={2}>
        <Rect x={3} y={4} width={18} height={18} rx={2} />
        <Path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
);

export function UpcomingList({
    heading = 'Upcoming',
    viewAllText = 'View all',
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
    const cardWidth = (Dimensions.get('window').width - 32) * 0.86; // flex: 0 0 86%
    return (
        <View style={{ paddingVertical: 16 }}>
            <View style={styles.header}>
                <Text style={styles.heading}>{heading}</Text>
                <Text style={styles.count}>{items.length}</Text>
                <View style={{ flex: 1 }} />
                {viewAllText ? <Text style={styles.viewAll}>{viewAllText}</Text> : null}
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={cardWidth + 12}
                snapToAlignment="start"
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
                {items.map((it, i) => {
                    const t = TONE[it.statusTone ?? 'success'];
                    return (
                        <Pressable key={i} onPress={it.onClick} style={[styles.card, { width: cardWidth }]}>
                            <View style={{ flex: 1, gap: 6 }}>
                                <Text style={styles.title}>{it.title}</Text>
                                {it.location ? (
                                    <View style={styles.meta}>
                                        <PinIcon />
                                        <Text style={styles.metaText}>{it.location}</Text>
                                    </View>
                                ) : null}
                                {it.datetime ? (
                                    <View style={styles.meta}>
                                        <CalIcon />
                                        <Text style={styles.metaText}>{it.datetime}</Text>
                                    </View>
                                ) : null}
                                {it.status ? (
                                    <View style={[styles.badge, { backgroundColor: t.bg }]}>
                                        <Text style={[styles.badgeText, { color: t.fg }]}>{it.status}</Text>
                                    </View>
                                ) : null}
                            </View>
                            {it.image ? <Image source={{ uri: it.image }} resizeMode="cover" style={styles.thumb} /> : null}
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
    heading: { fontSize: 18, fontWeight: '700', color: '#0A2333' },
    count: { fontSize: 18, fontWeight: '600', color: '#AFAEAD', marginLeft: 6 },
    viewAll: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
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
    meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { fontSize: 13, color: '#5A6B7E' },
    badge: { alignSelf: 'flex-start', marginTop: 2, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 100 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    thumb: { width: 84, height: 84, borderRadius: 10 },
});
