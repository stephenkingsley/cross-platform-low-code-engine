/**
 * React Native binding for Card — SAME props as `card.tsx`. The web `boxShadow` /
 * `border` CSS strings become RN's shadow props (iOS) / `elevation` (Android) and
 * `borderWidth`/`borderColor`; `background` → `backgroundColor`.
 */
import { View, StyleSheet, Platform } from 'react-native';
import { SPACING } from './tokens';
import type { CardProps } from './card';

const RADIUS = { none: 0, sm: 8, md: 12, lg: 20 } as const;

export function Card({ padding = 'md', radius = 'md', shadow = true, children }: CardProps) {
    return (
        <View
            style={[
                {
                    padding: SPACING[padding],
                    borderRadius: RADIUS[radius],
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#eef1f4',
                },
                shadow ? styles.shadow : null,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    shadow: Platform.select({
        ios: {
            shadowColor: '#0a2333',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 10,
        },
        android: { elevation: 3 },
        default: {},
    }),
});
