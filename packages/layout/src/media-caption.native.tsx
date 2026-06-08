/**
 * React Native binding for MediaCaption — SAME props as the web `media-caption.tsx`,
 * rendered with RN primitives. Metro resolves this file on native, the `.tsx` on web,
 * so the saved document (which only carries platform-agnostic props) renders on both.
 *
 *   web (media-caption.tsx)        native (this file)
 *   ─────────────────────────      ──────────────────────────────
 *   <div> + CSS                    <View> + StyleSheet
 *   background-image: gradient     <LinearGradient> (expo-linear-gradient)
 *   backdrop-filter: blur          translucent bg (or @react-native-community/blur)
 *   text-overflow: ellipsis        <Text numberOfLines={1}>
 *   lineHeight: '18px'             lineHeight: 18  (RN takes a number)
 */
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { MediaCaptionProps } from './media-caption';

export function MediaCaption({ badge, title, description }: MediaCaptionProps) {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.30)', 'rgba(0,0,0,0.75)']}
                locations={[0.0734, 0.4931, 0.9128]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.fill}>
                <View style={styles.badgeRow}>
                    {badge ? (
                        <View style={styles.pill}>
                            <Text style={styles.pillText}>{badge}</Text>
                        </View>
                    ) : null}
                </View>
                <View>
                    {title ? (
                        <Text numberOfLines={1} style={styles.title}>
                            {title}
                        </Text>
                    ) : null}
                    {description ? (
                        <Text numberOfLines={1} style={styles.desc}>
                            {description}
                        </Text>
                    ) : null}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    fill: { ...StyleSheet.absoluteFillObject, padding: 16, justifyContent: 'space-between' },
    badgeRow: { flexDirection: 'row' },
    pill: {
        alignSelf: 'flex-start',
        paddingVertical: 5,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(0,0,0,0.40)',
        borderRadius: 100,
    },
    pillText: { fontSize: 12, lineHeight: 18, color: '#fefdfd' },
    title: { fontFamily: 'Cabin', fontSize: 20, lineHeight: 30, fontWeight: '500', color: '#ececec' },
    desc: { fontSize: 12, lineHeight: 18, color: '#ececec', marginTop: 4 },
});
