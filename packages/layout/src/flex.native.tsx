/**
 * React Native binding for Flex — SAME flexbox tokens as `flex.tsx`, rendered on a
 * `<View>` instead of a `<div>`. The token→style mapping is identical (flexbox is the
 * shared cross-platform vocabulary); only the host element differs.
 */
import { View } from 'react-native';
import { SPACING } from './tokens';
import type { FlexProps } from './flex';

const JUSTIFY = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
    evenly: 'space-evenly',
} as const;
const ALIGN = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
} as const;

export function Flex({
    direction = 'column',
    justify = 'start',
    align = 'stretch',
    gap = 'none',
    padding = 'none',
    wrap = false,
    children,
}: FlexProps) {
    return (
        <View
            style={{
                flexDirection: direction,
                justifyContent: JUSTIFY[justify],
                alignItems: ALIGN[align],
                flexWrap: wrap ? 'wrap' : 'nowrap',
                gap: SPACING[gap],
                padding: SPACING[padding],
            }}
        >
            {children}
        </View>
    );
}
