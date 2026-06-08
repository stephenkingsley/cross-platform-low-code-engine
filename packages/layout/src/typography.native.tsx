/**
 * React Native binding for Typography — SAME props + the SAME dp-design type tokens as
 * `typography.tsx`, rendered on `<Text>`. RN takes a numeric `lineHeight` (not '28px')
 * and a string `fontWeight`, and clamps lines with `numberOfLines` (not -webkit-line-clamp).
 */
import { Text } from 'react-native';
import type { TypographyProps } from './typography';

const VARIANT = {
    title: { fontSize: 18, lineHeight: 28, fontWeight: '700' as const, color: '#0A2333' },
    subtitle: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const, color: '#4B4A4A' },
    body: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, color: '#737272' },
    caption: { fontSize: 12, lineHeight: 18, fontWeight: '400' as const, color: '#AFAEAD' },
};

export function Typography({ text, variant = 'body', align = 'left', maxLines = 0 }: TypographyProps) {
    const v = VARIANT[variant];
    return (
        <Text
            numberOfLines={maxLines > 0 ? maxLines : undefined}
            style={{
                fontFamily: 'Poppins',
                fontSize: v.fontSize,
                lineHeight: v.lineHeight,
                fontWeight: v.fontWeight,
                color: v.color,
                textAlign: align,
            }}
        >
            {text}
        </Text>
    );
}
