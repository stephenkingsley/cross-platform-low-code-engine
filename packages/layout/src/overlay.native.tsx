/**
 * React Native binding for Overlay — SAME props as `overlay.tsx`. Absolute fill +
 * flex anchoring map directly to RN; the web `background-image` scrim gradient becomes
 * an `expo-linear-gradient` layer.
 *
 * NOTE: the web Overlay sets `color:#fff` so descendant text inherits white. RN `Text`
 * does NOT inherit colour from a parent `View`, so on native the children (Typography,
 * etc.) must carry their own colour — use a light Typography variant inside a scrim.
 */
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING } from './tokens';
import type { OverlayProps } from './overlay';

const PLACE = { top: 'flex-start', center: 'center', bottom: 'flex-end' } as const;
const ALIGN = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
} as const;

export function Overlay({
    placement = 'bottom',
    align = 'start',
    scrim = true,
    padding = 'md',
    gap = 'xs',
    children,
}: OverlayProps) {
    return (
        <View
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                justifyContent: PLACE[placement],
                alignItems: ALIGN[align],
                padding: SPACING[padding],
                gap: SPACING[gap],
            }}
        >
            {scrim ? (
                <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.22)', 'rgba(0,0,0,0.66)']}
                    locations={[0.28, 0.58, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
                />
            ) : null}
            {children}
        </View>
    );
}
