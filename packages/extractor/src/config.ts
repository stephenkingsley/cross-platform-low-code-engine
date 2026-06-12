import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ComponentSource } from '@lce/manifest';

const here = path.dirname(fileURLToPath(import.meta.url));
/** packages/extractor/src → engine repo root */
export const REPO_ROOT = path.resolve(here, '../../..');
/** dp-design is checked out as a sibling repo of the engine. */
const DP_ROOT = path.resolve(REPO_ROOT, '../dp-design');
/** pandora-box-layout (sibling repo) — the SSOT for the engine/template components (Flex/Card/…). */
const PBL_ROOT = path.resolve(REPO_ROOT, '../pandora-box-layout');

export interface ExtractTarget {
    /** Component type id — the registry key and `node.type` in saved documents. */
    name: string;
    /** Exported Props type to read (e.g. `'ButtonProps'`). */
    propsType: string;
    /** Source file holding the Props type, relative to the project root. */
    file: string;
    source: ComponentSource;
    category?: string;
    /**
     * Optional allow-list. When set, ONLY these props are surfaced. Normally left
     * unset: every meaningful prop is exposed and only DOM/aria/event/CSS noise is
     * filtered out automatically.
     */
    include?: string[];
    /** Optional deny-list of prop names to hide (for the odd inherited attribute). */
    exclude?: string[];
    /**
     * How to treat a `children` prop. Default: ReactNode children → slot, string
     * children → text. Set `'text'` for text-bearing leaves (e.g. a Button label).
     */
    childrenAs?: 'text' | 'slot';
    /**
     * Prop names to coerce to a plain text field even though they are typed as
     * ReactNode (e.g. `title` / `content` slots that are really text).
     */
    textProps?: string[];
    /** Prop names (ReactNode) to expose as nesting SLOTS — drop other components inside. */
    slotProps?: string[];
    /** When true, ALL non-children ReactNode props become slots (used by barrel auto-discovery). */
    reactNodeAsSlot?: boolean;
    /** When true, append a synthetic `action` field (declarative "on click") to this component. */
    action?: boolean;
    /**
     * When true, append a synthetic `binding` field — a {@link DataBinding} (source +
     * field map). The component renders its static `items` until the project supplies
     * real data under the binding's `source`; the runtime then maps it onto `items`.
     */
    dataBound?: boolean;
}

export interface ExtractProject {
    /** Absolute root that `tsConfigFilePath` + each target `file` resolve against. */
    root: string;
    /** tsconfig used to resolve types (so inherited / aliased types resolve). */
    tsConfigFilePath: string;
    targets: ExtractTarget[];
}

/** Engine + template primitives — read from the SSOT `pandora-box-layout` sibling repo. */
export const LAYOUT_PROJECT: ExtractProject = {
    root: PBL_ROOT,
    tsConfigFilePath: 'tsconfig.json',
    targets: [
        { name: 'Flex', propsType: 'FlexProps', file: 'src/flex.tsx', source: 'engine', category: 'Layout', action: true },
        { name: 'Card', propsType: 'CardProps', file: 'src/card.tsx', source: 'engine', category: 'Layout', action: true },
        { name: 'Overlay', propsType: 'OverlayProps', file: 'src/overlay.tsx', source: 'engine', category: 'Layout' },
        { name: 'Positioned', propsType: 'PositionedProps', file: 'src/positioned.tsx', source: 'engine', category: 'Layout' },
        { name: 'Typography', propsType: 'TypographyProps', file: 'src/typography.tsx', source: 'engine', category: 'Content' },
        { name: 'MediaCaption', propsType: 'MediaCaptionProps', file: 'src/media-caption.tsx', source: 'engine', category: 'Content' },
        { name: 'MediaCarousel', propsType: 'MediaCarouselProps', file: 'src/media-carousel.tsx', source: 'engine', category: 'Media' },
        { name: 'Swiper', propsType: 'SwiperProps', file: 'src/swiper.tsx', source: 'engine', category: 'Media' },
        { name: 'HeroOverview', propsType: 'HeroOverviewProps', file: 'src/hero-overview.tsx', source: 'engine', category: 'Templates' },
        { name: 'WhatsNew', propsType: 'WhatsNewProps', file: 'src/whats-new.tsx', source: 'engine', category: 'Templates' },
        { name: 'UpcomingList', propsType: 'UpcomingListProps', file: 'src/upcoming-list.tsx', source: 'engine', category: 'Templates', dataBound: true },
        { name: 'ServiceList', propsType: 'ServiceListProps', file: 'src/service-list.tsx', source: 'engine', category: 'Templates', dataBound: true },
    ],
};

const DP = 'packages/atom-ui-mobile/src/components';

/**
 * dp-design components. No `include` allow-lists — EVERY meaningful prop is exposed;
 * the extractor only filters DOM/aria/event/CSS noise (props declared on React's base
 * interfaces) automatically. `textProps` keeps ReactNode "text slots" as text fields.
 */
export const DP_DESIGN_PROJECT: ExtractProject = {
    root: DP_ROOT,
    tsConfigFilePath: 'packages/atom-ui-mobile/tsconfig.json',
    targets: [
        { name: 'Text', propsType: 'TextProps', file: `${DP}/text/text.tsx`, source: 'dp-design', category: 'dp-design', childrenAs: 'text' },
        { name: 'Image', propsType: 'ImageProps', file: `${DP}/image/image.tsx`, source: 'dp-design', category: 'dp-design', exclude: ['containerWidth', 'crossOrigin', 'decoding', 'fetchPriority', 'referrerPolicy', 'useMap'] },
        { name: 'Button', propsType: 'ButtonProps', file: `${DP}/button/button.tsx`, source: 'dp-design', category: 'dp-design', childrenAs: 'text', action: true },
        { name: 'LabelInput', propsType: 'LabelInputProps', file: `${DP}/label-input/label-input.tsx`, source: 'dp-design', category: 'dp-design' },
        { name: 'Tag', propsType: 'TagProps', file: `${DP}/tag/tag.tsx`, source: 'dp-design', category: 'dp-design', childrenAs: 'text' },
        { name: 'Alert', propsType: 'AlertProps', file: `${DP}/alert/alert.tsx`, source: 'dp-design', category: 'dp-design', textProps: ['title', 'content'] },
        { name: 'Switch', propsType: 'SwitchProps', file: `${DP}/switch/switch.tsx`, source: 'dp-design', category: 'dp-design', textProps: ['checkedText', 'uncheckedText'] },
        { name: 'Bill', propsType: 'BillProps', file: `${DP}/bill/bill.tsx`, source: 'dp-design', category: 'dp-design', textProps: ['subtotalTitle', 'entitlementTitle', 'totalTitle', 'subtotal', 'entitlement', 'total'] },
        { name: 'NavHeader', propsType: 'NavHeaderProps', file: `${DP}/nav-header/nav-header.tsx`, source: 'dp-design', category: 'dp-design', textProps: ['title'], slotProps: ['leftContent', 'rightContent'] },
        { name: 'DataRow', propsType: 'DataRowProps', file: `${DP}/data-row/data-row.tsx`, source: 'dp-design', category: 'dp-design', textProps: ['title', 'content'], slotProps: ['prefix', 'suffix'] },
        { name: 'Link', propsType: 'LinkProps', file: `${DP}/link/link.tsx`, source: 'dp-design', category: 'dp-design', childrenAs: 'text', action: true },
        { name: 'Rate', propsType: 'RateProps', file: `${DP}/rate/rate.tsx`, source: 'dp-design', category: 'dp-design' },
        { name: 'LinkCard', propsType: 'LinkCardProps', file: `${DP}/link-card/link-card.tsx`, source: 'dp-design', category: 'dp-design', textProps: ['text', 'content'], slotProps: ['prefix', 'suffix'], action: true },
        { name: 'Form', propsType: 'FormProps', file: `${DP}/form/form.tsx`, source: 'dp-design', category: 'dp-design' },
        { name: 'Collapse', propsType: 'CollapseProps', file: `${DP}/collapse/collapse.tsx`, source: 'dp-design', category: 'dp-design' },
        { name: 'Tabs', propsType: 'TabsProps', file: `${DP}/tabs/tabs.tsx`, source: 'dp-design', category: 'dp-design' },
        { name: 'Segmented', propsType: 'SegmentedProps', file: `${DP}/segmented/index.d.ts`, source: 'dp-design', category: 'dp-design' },
        { name: 'RadioButtonGroup', propsType: 'RadioButtonGroupProps', file: `${DP}/radio-button-group/radio-button-group.tsx`, source: 'dp-design', category: 'dp-design' },
        { name: 'CheckboxButtonGroup', propsType: 'CheckboxButtonGroupProps', file: `${DP}/checkbox-button-group/checkbox-button-group.tsx`, source: 'dp-design', category: 'dp-design' },
        // Swiper is wrapped by pandora-box-layout (`src/swiper.tsx`) — full-bleed image + a builder-bindable
        // `dots` toggle (the dp Swiper's `indicator` is a render-fn) — so it's an engine target above, not here.
    ],
};

export const PROJECTS: ExtractProject[] = [LAYOUT_PROJECT, DP_DESIGN_PROJECT];

/** Single merged manifest — written straight to the published `pandora-box-manifest` (sibling repo). */
export const OUT = '../pandora-box-manifest/src/manifest.json';

/** Barrel file (relative to DP root) for auto-discovering the rest of the library. */
export const DP_BARREL = 'packages/atom-ui-mobile/src/index.ts';
/** Props-type → component export name, where they differ. */
export const NAME_ALIASES: Record<string, string> = {
    PaymentProps: 'EntitlementPayment',
    NumberStepperProps: 'Stepper',
};
