/**
 * Editor chrome customizations for the Puck shell — friendly, branded UI for
 * ops / marketing users: component cards with coloured monogram chips, and the
 * component list grouped into meaningful categories (covers the whole library).
 */

const LABELS: Record<string, string> = {
    LabelInput: 'Label Input',
    NavHeader: 'Nav Header',
    DataRow: 'Data Row',
    LinkCard: 'Link Card',
    RadioButtonGroup: 'Radio Group',
    CheckboxButtonGroup: 'Checkbox Group',
    QrCode: 'QR Code',
    Nps: 'NPS',
    IntlTelInput: 'Phone Input',
    SecurePaymentInfo: 'Secure Payment',
    EsimPolicyAgree: 'eSIM Policy',
    HeroOverview: 'Hero overview',
    WhatsNew: "What's new",
    UpcomingList: 'Upcoming',
    ServiceList: 'Available services',
};

/** `NavHeader` → `Nav Header` */
function labelOf(name: string): string {
    return LABELS[name] ?? name.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

/** Stable hue per component name, for a tasteful per-component chip colour. */
function hueOf(name: string): number {
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
}

/** Puck overrides: render each drawer item as a polished card. */
export const puckOverrides = {
    drawerItem: ({ name }: { name: string }) => {
        const h = hueOf(name);
        return (
            <div className="lce-block">
                <span
                    className="lce-block__chip"
                    style={{ background: `hsl(${h} 70% 93%)`, color: `hsl(${h} 55% 32%)` }}
                >
                    {name[0]}
                </span>
                <span className="lce-block__name">{labelOf(name)}</span>
                <span className="lce-block__grip" aria-hidden>
                    ⠿
                </span>
            </div>
        );
    },
};

/** Group the whole component drawer into friendly categories (covers all components). */
export const categories = {
    templates: { title: 'Templates', components: ['HeroOverview', 'WhatsNew', 'UpcomingList', 'ServiceList'] },
    // Free-layout trio: Overlay (the panel over a slide/image), Positioned (absolute x/y inside it), Flex.
    layout: { title: 'Layout', components: ['Overlay', 'Positioned', 'Flex'] },
    container: { title: 'Container', components: ['Card', 'Typography', 'Divider', 'Collapse', 'Sheet', 'SafeArea'] },
    content: { title: 'Content', components: ['Text', 'Tag', 'LinkCard', 'DataRow', 'Overview', 'FlightCard', 'Bill', 'Journey'] },
    media: { title: 'Media', components: ['Image', 'Swiper', 'MediaCarousel', 'MediaCaption', 'ImageViewer', 'ScrollView', 'QrCode'] },
    forms: {
        title: 'Forms & input',
        components: [
            'Form',
            'LabelInput',
            'LabelTextArea',
            'TextArea',
            'SearchBar',
            'SelectInput',
            'Switch',
            'Checkbox',
            'Radio',
            'RadioButton',
            'RadioButtonGroup',
            'CheckboxButtonGroup',
            'Segmented',
            'Rate',
            'Stepper',
        ],
    },
    pickers: {
        title: 'Pickers',
        components: [
            'CalendarSelect',
            'CalendarPicker',
            'TimePicker',
            'TimeSelect',
            'TimeSelectPanel',
            'CountrySearch',
            'IntlTelInput',
            'FilterPanel',
            'SearchList',
        ],
    },
    commerce: {
        title: 'Commerce & payment',
        components: ['Button', 'PayCard', 'AddPayCard', 'SecurePaymentInfo', 'EntitlementPayment', 'ProductSelect', 'ProductRecommend'],
    },
    navigation: { title: 'Navigation', components: ['NavHeader', 'TabBar', 'Tabs', 'Link', 'Steps'] },
    feedback: {
        title: 'Feedback & overlay',
        components: ['Alert', 'Modal', 'Drawer', 'DrawerInfo', 'ResultPage', 'Tour', 'Guide', 'FeedbackComment', 'Nps'],
    },
    status: { title: 'Status & progress', components: ['ProgressBar', 'ProgressCircle', 'ProgressSegment'] },
    agreements: { title: 'Agreements', components: ['PolicyAgree', 'EsimPolicyAgree'] },
};
