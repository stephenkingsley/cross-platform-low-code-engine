/**
 * React Native binding for the Text primitive — SAME props + the SAME dp tokens as
 * `text.tsx`, rendered on RN `<Text>`. Inlines the align + weight maps (rather than
 * importing `resolveTextStyle` from './text', which Metro would resolve back to this
 * file); RN wants a STRING fontWeight, so the weight token maps to '400'/'500'/'700'.
 */
import { Text as RNText } from 'react-native';
import { FONT_SIZE, type SizeToken, type WeightToken } from './tokens';
import type { TextProps, TextAlign } from './text';

const TEXT_ALIGN: Record<TextAlign, 'left' | 'center' | 'right'> = {
    start: 'left',
    center: 'center',
    end: 'right',
};

const FONT_WEIGHT: Record<WeightToken, '400' | '500' | '700'> = {
    regular: '400',
    medium: '500',
    bold: '700',
};

export function Text({ children, size = 'md', weight = 'regular', align = 'start' }: TextProps) {
    return (
        <RNText
            style={{
                fontSize: FONT_SIZE[size as SizeToken],
                fontWeight: FONT_WEIGHT[weight as WeightToken],
                textAlign: TEXT_ALIGN[align],
            }}
        >
            {children ?? ''}
        </RNText>
    );
}
