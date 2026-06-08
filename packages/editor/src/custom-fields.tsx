import type { CSSProperties } from 'react';

const labelStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--puck-color-grey-03, #334155)',
    marginBottom: 7,
    fontFamily: 'inherit',
};

const inputStyle: CSSProperties = {
    flex: 1,
    width: '100%',
    height: 34,
    borderRadius: 8,
    border: '1px solid var(--puck-color-grey-09, #cbd5e1)',
    padding: '0 10px',
    fontFamily: 'inherit',
    fontSize: 13,
    background: 'var(--puck-color-white, #fff)',
    color: 'var(--puck-color-grey-02, #1f2937)',
    boxSizing: 'border-box',
};

interface FieldProps {
    value?: string;
    onChange: (v: string) => void;
    label?: string;
}

const LOCALE_LABEL: Record<string, string> = { en: 'EN', zh: '中文', ja: '日本語', ko: '한국어' };

interface LocalizedFieldProps {
    value?: string | Record<string, string>;
    onChange: (v: Record<string, string>) => void;
    label?: string;
    locales: string[];
    multiline?: boolean;
}

/**
 * Per-locale text input. A text prop becomes a `{ locale: string }` map, so the same
 * document carries every language. A legacy plain string shows in the first locale and
 * upgrades to a map on edit (runtime/editor resolve either form).
 */
export function LocalizedTextField({ value, onChange, label, locales, multiline }: LocalizedFieldProps) {
    const map: Record<string, string> =
        typeof value === 'string' ? { [locales[0]]: value } : { ...(value ?? {}) };
    const set = (loc: string, v: string) => onChange({ ...map, [loc]: v });
    return (
        <div style={{ fontFamily: 'inherit' }}>
            {label ? <div style={labelStyle}>{label}</div> : null}
            <div style={{ display: 'grid', gap: 6 }}>
                {locales.map((loc) => (
                    <div
                        key={loc}
                        style={{ display: 'flex', gap: 6, alignItems: multiline ? 'flex-start' : 'center' }}
                    >
                        <span
                            style={{
                                width: 36,
                                flex: 'none',
                                fontSize: 11,
                                fontWeight: 600,
                                color: 'var(--puck-color-grey-06, #94a3b8)',
                                paddingTop: multiline ? 9 : 0,
                            }}
                        >
                            {LOCALE_LABEL[loc] ?? loc}
                        </span>
                        {multiline ? (
                            <textarea
                                value={map[loc] ?? ''}
                                onChange={(e) => set(loc, e.target.value)}
                                style={{ ...inputStyle, height: 60, padding: 8, resize: 'vertical' }}
                            />
                        ) : (
                            <input
                                type="text"
                                value={map[loc] ?? ''}
                                onChange={(e) => set(loc, e.target.value)}
                                style={inputStyle}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Colour swatch + hex input. Auto-applied to `*color` string props. */
export function ColorField({ value, onChange, label }: FieldProps) {
    const hex = /^#[0-9a-fA-F]{6}$/.test(value ?? '') ? (value as string) : '#000000';
    return (
        <div style={{ fontFamily: 'inherit' }}>
            {label ? <div style={labelStyle}>{label}</div> : null}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                    type="color"
                    value={hex}
                    onChange={(e) => onChange(e.target.value)}
                    style={{
                        width: 40,
                        height: 34,
                        border: '1px solid var(--puck-color-grey-09, #cbd5e1)',
                        borderRadius: 8,
                        padding: 2,
                        background: '#fff',
                        cursor: 'pointer',
                        flex: 'none',
                    }}
                />
                <input
                    type="text"
                    value={value ?? ''}
                    placeholder="#0a2333"
                    onChange={(e) => onChange(e.target.value)}
                    style={inputStyle}
                />
            </div>
        </div>
    );
}

/** Image preview + URL input. Auto-applied to `src` / image-like props. */
export function ImageField({ value, onChange, label }: FieldProps) {
    return (
        <div style={{ fontFamily: 'inherit' }}>
            {label ? <div style={labelStyle}>{label}</div> : null}
            <div style={{ display: 'grid', gap: 8 }}>
                {value ? (
                    <img
                        src={value}
                        alt=""
                        style={{
                            width: '100%',
                            maxHeight: 130,
                            objectFit: 'cover',
                            borderRadius: 10,
                            border: '1px solid var(--puck-color-grey-10, #e5e7eb)',
                        }}
                    />
                ) : (
                    <div
                        style={{
                            height: 88,
                            borderRadius: 10,
                            border: '1px dashed var(--puck-color-grey-08, #cbd5e1)',
                            display: 'grid',
                            placeItems: 'center',
                            color: 'var(--puck-color-grey-06, #94a3b8)',
                            fontSize: 12,
                        }}
                    >
                        No image yet
                    </div>
                )}
                <input
                    type="text"
                    value={value ?? ''}
                    placeholder="Paste image URL…"
                    onChange={(e) => onChange(e.target.value)}
                    style={inputStyle}
                />
            </div>
        </div>
    );
}
