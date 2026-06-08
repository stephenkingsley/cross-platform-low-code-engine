/**
 * JSON Schema (draft-07) generator for saved documents.
 *
 * Turns the {@link Manifest} into a formal, tool-readable contract: every component
 * type, its configurable props, value types, enum options, nesting (slots/arrays).
 * Use it to validate documents, generate types, or audit the protocol.
 *
 * It is derived 100% from the manifest, so it always matches what the builder can
 * actually produce — there is no second source of truth to drift.
 */
import type { Manifest, ManifestField } from './index';

export interface SchemaOptions {
    /** Schema title. */
    title?: string;
    /**
     * When true, every `text`/`textarea` prop accepts a LOCALIZED value —
     * `string | { [locale]: string }` — so the same document carries every language.
     * @default false (current protocol: plain single-language strings)
     */
    localize?: boolean;
    /** Locales allowed in a localized string. @default ['en','zh'] */
    locales?: string[];
}

type JsonSchema = Record<string, unknown>;

export function documentJsonSchema(manifest: Manifest, opts: SchemaOptions = {}): JsonSchema {
    const {
        title = 'DragonPass Builder Document',
        localize = false,
        locales = ['en', 'zh'],
    } = opts;

    const textSchema: JsonSchema = localize
        ? { $ref: '#/definitions/LocalizedString' }
        : { type: 'string' };

    const fieldSchema = (f: ManifestField): JsonSchema => {
        const d = f.field;
        const note = f.description || f.label;
        switch (d.kind) {
            case 'text':
            case 'textarea':
                return { ...textSchema, title: note };
            case 'color':
                return { type: 'string', title: `${f.label} (colour, e.g. #16415e)` };
            case 'image':
                return { type: 'string', title: `${f.label} (image URL or data URI)` };
            case 'number':
                return {
                    type: 'number',
                    title: note,
                    ...(d.min !== undefined ? { minimum: d.min } : {}),
                    ...(d.max !== undefined ? { maximum: d.max } : {}),
                };
            case 'select':
                return { enum: d.options.map((o) => o.value), title: note };
            case 'radio':
                return { type: 'boolean', title: note };
            case 'slot':
                return {
                    type: 'array',
                    title: `${f.label} (nested components)`,
                    items: { $ref: '#/definitions/Node' },
                };
            case 'array': {
                const properties: Record<string, JsonSchema> = {};
                for (const itf of d.itemFields) properties[itf.name] = fieldSchema(itf);
                return {
                    type: 'array',
                    title: f.label,
                    items: { type: 'object', properties, additionalProperties: true },
                };
            }
        }
    };

    const definitions: Record<string, JsonSchema> = {};
    const nodeRefs: JsonSchema[] = [];

    for (const c of manifest.components) {
        const properties: Record<string, JsonSchema> = { id: { type: 'string' } };
        const required = ['id'];
        for (const f of c.fields) {
            properties[f.name] = fieldSchema(f);
            if (f.required) required.push(f.name);
        }
        definitions[c.name] = {
            type: 'object',
            title: c.name,
            required: ['type', 'props'],
            additionalProperties: false,
            properties: {
                type: { const: c.name },
                props: { type: 'object', properties, required, additionalProperties: true },
            },
        };
        nodeRefs.push({ $ref: `#/definitions/${c.name}` });
    }

    definitions.Node = {
        description: 'A placed component instance, discriminated by `type`.',
        oneOf: nodeRefs,
    };

    if (localize) {
        definitions.LocalizedString = {
            description: 'A translatable string — a plain string, or a map of locale → string.',
            oneOf: [
                { type: 'string' },
                {
                    type: 'object',
                    propertyNames: { enum: locales },
                    additionalProperties: { type: 'string' },
                    minProperties: 1,
                },
            ],
        };
    }

    return {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title,
        description:
            'Platform-agnostic page document produced by the DragonPass builder. Renders on React (web) and React Native from the same JSON. Generated from the component manifest.',
        type: 'object',
        required: ['content'],
        additionalProperties: false,
        properties: {
            root: {
                type: 'object',
                properties: { props: { type: 'object' } },
                additionalProperties: false,
            },
            content: {
                type: 'array',
                description: 'The page, top to bottom.',
                items: { $ref: '#/definitions/Node' },
            },
            zones: { type: 'object', description: 'Legacy Puck zones — unused.' },
        },
        definitions,
    };
}
