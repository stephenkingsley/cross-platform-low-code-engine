import { useMemo, type ComponentType, type ReactNode } from 'react';
import { Puck, type Data, type Fields } from '@puckeditor/core';
import type { Manifest } from '@lce/manifest';
import { buildPuckConfig, type BuildOptions, type ComponentRegistry } from './build-config';

export interface EditorProps {
    manifest: Manifest;
    registry: ComponentRegistry;
    /** Initial document. */
    data: Data;
    /** Fired on every edit. */
    onChange?: (data: Data) => void;
    /** Fired when the user hits Publish. */
    onPublish?: (data: Data) => void;
    /**
     * Wraps the canvas content (Puck `root.render`) — e.g. a design-system provider
     * that sets up theming/styles for the previewed components.
     */
    canvasWrapper?: ComponentType<{ children: ReactNode }>;
    /** Render the canvas inside an iframe (enables responsive widths). Default true. */
    iframe?: boolean;
    /** Puck UI overrides (drawerItem, headerActions, fieldLabel, …) to brand the shell. */
    overrides?: Record<string, unknown>;
    /** Group the component drawer into categories. */
    categories?: BuildOptions['categories'];
    /** Active content locale — localized text renders in this language on the canvas. */
    locale?: string;
    /** Fallback locale for missing translations. */
    fallbackLocale?: string;
    /** Locales to author. When more than one, text fields become per-locale inputs. */
    locales?: string[];
    /** Host-provided image picker (e.g. Contentful media browser) for image fields. */
    assetPicker?: () => Promise<unknown | null>;
    /** Extra fields for Puck's root "PAGE" panel (they edit `data.root.props`). */
    rootFields?: Fields;
    /** Heading for the root "PAGE" panel (defaults to "Page"). */
    rootLabel?: string;
    /** Feature-flag catalog for the per-block Visibility control (entitlement keys ops gate on). */
    flagCatalog?: BuildOptions['flagCatalog'];
    /** Which tier the config panel serves. Defaults to `design` — an existing host is unchanged. */
    mode?: BuildOptions['mode'];
    /** Ops mode only: keep the design tier editable instead of collapsing it into read-only "Looks". */
    allowStyleOverride?: BuildOptions['allowStyleOverride'];
    /** What a flag IS to this host, in ops words ("benefit", "tier", "plan"). Defaults to "benefit". */
    flagNoun?: BuildOptions['flagNoun'];
    /** App events a block's `action` may fire. Absent → the event name falls back to free text. */
    eventCatalog?: BuildOptions['eventCatalog'];
}

/** Thin wrapper that turns a manifest + registry into a ready-to-use Puck editor. */
export function Editor({
    manifest,
    registry,
    data,
    onChange,
    onPublish,
    canvasWrapper,
    iframe = true,
    overrides,
    categories,
    locale,
    fallbackLocale,
    locales,
    assetPicker,
    rootFields,
    rootLabel,
    flagCatalog,
    mode,
    allowStyleOverride,
    flagNoun,
    eventCatalog,
}: EditorProps) {
    const config = useMemo(
        () =>
            buildPuckConfig(manifest, registry, {
                rootRender: canvasWrapper,
                categories,
                locale,
                fallbackLocale,
                locales,
                assetPicker,
                rootFields,
                rootLabel,
                flagCatalog,
                mode,
                allowStyleOverride,
                flagNoun,
                eventCatalog,
            }),
        [manifest, registry, canvasWrapper, categories, locale, fallbackLocale, locales, assetPicker, rootFields, rootLabel, flagCatalog, mode, allowStyleOverride, flagNoun, eventCatalog],
    );
    return (
        <Puck
            config={config}
            data={data}
            onChange={onChange}
            onPublish={onPublish}
            iframe={{ enabled: iframe }}
            overrides={overrides as never}
        />
    );
}
