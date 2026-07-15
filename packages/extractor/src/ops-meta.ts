/**
 * Ops-facing copy for props the extractor cannot name well on its own.
 *
 * `humanize(name)` produces the ENGINEER's word for a prop (`fit`, `type`, `children`).
 * Ops needs the OUTCOME ("How the image fills the space"), so that copy is authored here
 * and merged in {@link classify}. Same patching pattern as `config.ts`'s dp targets:
 * the map wins over JSDoc, JSDoc wins over `humanize(name)`.
 *
 * Only components ops actually touch need entries — everything else falls back to the
 * JSDoc/humanize chain, and the coverage line in `writeManifest` reports the gap.
 */
import type { ManifestField } from '@lce/manifest';

/** A partial override applied on top of an extracted field. Copy only — never the field KIND. */
export type FieldPatch = Partial<Pick<ManifestField, 'label' | 'help' | 'audience' | 'answers'>>;

/**
 * Field kinds that are "content" (the data a block carries) rather than "style".
 * MUST mirror the editor's `CONTENT_FIELD_KINDS` — the two drive the same ops/design split,
 * here for the coverage stat and there for the panel. Drift only skews the printed number.
 */
const CONTENT_FIELD_KINDS = new Set(['text', 'textarea', 'url', 'image', 'slot', 'array', 'action']);

/**
 * Which tier owns a field: an explicit `audience` wins, else content kinds are ops. `dataMap` is
 * neither content nor style — it wires the block to server data — so it is named here rather than
 * left to the "everything else is design" fallback. MUST mirror the editor's `audienceOf`.
 */
export function audienceOf(f: ManifestField): 'ops' | 'design' {
    if (f.audience) return f.audience;
    if (f.field.kind === 'dataMap') return 'ops';
    return CONTENT_FIELD_KINDS.has(f.field.kind) ? 'ops' : 'design';
}

/** `Component → prop → patch`. `answers` keys are `String(optionValue)`. */
export const OPS_META: Record<string, Record<string, FieldPatch>> = {
    Card: {
        children: { label: 'Inside this card' },
    },
    Alert: {
        title: { label: 'Headline' },
        content: { label: 'The message', help: 'One or two sentences. Say what happened and what to do next.' },
        type: {
            audience: 'ops',
            label: 'Tone',
            answers: {
                info: 'Just so you know',
                muted: 'Quiet note',
                success: 'Positive',
                warning: 'Heads-up',
                error: 'Problem',
            },
        },
        showClose: {
            audience: 'ops',
            label: 'Can people dismiss it?',
            answers: { true: 'Yes — show a close button', false: 'No — it stays put' },
        },
    },
    Image: {
        src: { label: 'The picture' },
        alt: {
            label: 'Description for screen readers',
            help: 'What the picture shows. Leave empty only if it is purely decorative.',
        },
        fit: {
            audience: 'ops',
            label: 'How the image fills the space',
            answers: {
                cover: 'Fill the space (may crop)',
                contain: 'Fit inside (may letterbox)',
                fill: 'Stretch to fit (may distort)',
                none: 'Original size',
                'scale-down': 'Original size, shrunk if too big',
            },
        },
    },
    Tag: {
        children: { label: 'Tag text' },
        theme: {
            audience: 'ops',
            label: 'What the tag means',
            answers: {
                primary: 'Highlighted',
                success: 'Positive',
                warning: 'Heads-up',
                danger: 'Problem',
                info: 'Just so you know',
                muted: 'Quiet note',
            },
        },
    },
    Button: {
        children: { label: 'Button text', help: 'Name the action, e.g. "Book a table" — not "Click here".' },
        type: {
            audience: 'ops',
            label: 'How important is this button',
            answers: {
                primary: 'The main action',
                secondary: 'A secondary action',
                tertiary: 'A low-key action',
                tertiaryLink: 'Looks like a link',
                danger: 'Destructive — deletes or cancels something',
            },
        },
        disabled: {
            audience: 'ops',
            label: 'Greyed out',
            answers: { true: 'Yes — people cannot tap it', false: 'No — people can tap it' },
        },
        loadingText: { label: 'Text while it is working', help: 'Shown after a tap, e.g. "Booking…".' },
    },
};

/** Apply the {@link OPS_META} patch for `component.prop`, if any. The map wins over JSDoc. */
export function applyOpsMeta(field: ManifestField, component: string): ManifestField {
    const patch = OPS_META[component]?.[field.name];
    return patch ? { ...field, ...patch } : field;
}
