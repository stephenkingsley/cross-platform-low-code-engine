# dp-design — full component prop inventory

> 68 components · 764 props. Resolved from each `*Props` type (follows antd re-exports); generic DOM/aria/event noise (`HTMLAttributes`/`AriaAttributes`/`DOMAttributes`) filtered out. `fn` = function/event handler, `ReactNode` = slot.

## AddPayCard (3)

- `children: ReactI18NextChildren | Iterable<ReactI18…`
- `onAddPayCard: Function`
- `onSuccess: fn`

## Alert (10)

- `alertId: number`
- `content: ReactNode`
- `customIcon: ReactNode`
- `duration: number`
- `onClose: fn`
- `showClose: boolean`
- `showIcon: boolean`
- `showShadow: boolean`
- `title: ReactNode`
- `type: 'success'|'warning'|'error'|'info'|'muted'`

## Bill (7)

- `entitlement: ReactNode`
- `entitlementTitle: ReactNode`
- `itemList: ReactNode`
- `subtotal: ReactNode`
- `subtotalTitle: ReactNode`
- `total: ReactNode`
- `totalTitle: ReactNode`

## Button (14)

- `ariaLabel: string`
- `block: boolean`
- `children: ReactNode`
- `disabled: boolean`
- `leftIcon: ReactNode`
- `loading: boolean | 'auto'`
- `loadingIcon: ReactNode`
- `loadingSize: number`
- `loadingText: string`
- `onClick: fn`
- `rightIcon: ReactNode`
- `shape: 'default'|'rounded'|'rectangular'`
- `size: 'mini'|'small'|'middle'|'large'`
- `type: 'primary'|'secondary'|'tertiary'|'tertiaryLink'|'danger'`

## CalendarPicker (17)

- `cancelButtonProps: Partial<ButtonProps>`
- `cancelText: string`
- `confirmButtonProps: Partial<ButtonProps>`
- `confirmText: string`
- `defaultValue: Date | Date[]`
- `description: ReactNode`
- `footer: ReactNode`
- `max: Date`
- `min: Date`
- `onChange: fn`
- `onClose: fn`
- `onConfirm: fn`
- `selectionMode: 'single'|'range'`
- `shouldDisableDate: fn`
- `title: ReactNode`
- `value: Date | Date[]`
- `visible: boolean`

## CalendarSelect (20)

- `cancelButtonProps: Partial<ButtonProps>`
- `cancelText: string`
- `confirmButtonProps: Partial<ButtonProps>`
- `confirmText: string`
- `defaultValue: Date | Date[]`
- `description: ReactNode`
- `disabled: boolean`
- `format: string`
- `max: Date`
- `min: Date`
- `onChange: fn`
- `placeholder: string`
- `prefix: ReactNode`
- `required: boolean`
- `selectionMode: 'single'|'range'`
- `shouldDisableDate: fn`
- `showIcon: boolean`
- `suffix: ReactNode`
- `title: ReactNode`
- `value: Date | Date[]`

## CalenderPicker (17)

- `cancelButtonProps: Partial<ButtonProps>`
- `cancelText: string`
- `confirmButtonProps: Partial<ButtonProps>`
- `confirmText: string`
- `defaultValue: Date | Date[]`
- `description: ReactNode`
- `footer: ReactNode`
- `max: Date`
- `min: Date`
- `onChange: fn`
- `onClose: fn`
- `onConfirm: fn`
- `selectionMode: 'single'|'range'`
- `shouldDisableDate: fn`
- `title: ReactNode`
- `value: Date | Date[]`
- `visible: boolean`

## CheckboxButtonGroup (6)

- `align: 'left'|'center'`
- `defaultValue: string[]`
- `disabled: boolean`
- `onChange: fn`
- `options: Array<CheckboxButtonOptionItem>`
- `value: string[]`

## Checkbox (10)

- `block: boolean`
- `checked: boolean`
- `children: ReactNode`
- `defaultChecked: boolean`
- `disabled: boolean`
- `icon: fn`
- `indeterminate: boolean`
- `onChange: fn`
- `onClick: fn`
- `value: number|string`

## Collapse (9)

- `accordion: boolean`
- `activeKey: T`
- `arrow: ReactNode`
- `arrowIcon: ReactNode`
- `bordered: boolean`
- `children: ReactNode`
- `defaultActiveKey: T`
- `items: CollapseItem[]`
- `onChange: fn`

## CountrySearch (10)

- `dataSource: CountryItemType[]`
- `filterOption: fn`
- `locale: string`
- `onChange: fn`
- `onEnter: fn`
- `onSelect: fn`
- `placeholder: string`
- `renderItem: fn`
- `searchValue: string`
- `title: string`

## DataRow (7)

- `content: ReactNode`
- `direction: 'vertical'|'horizontal'`
- `prefix: ReactNode`
- `showDivider: boolean`
- `showSkeleton: boolean`
- `suffix: ReactNode`
- `title: ReactNode`

## Divider (3)

- `children: ReactNode`
- `contentPosition: 'left'|'center'|'right'`
- `direction: 'vertical'|'horizontal'`

## DrawerInfo (22)

- `buttonsDirection: 'vertical'|'horizontal'`
- `children: ReactNode`
- `closeIconStyle: CSSProperties`
- `contentAlign: 'left'|'center'|'right'`
- `contentStyle: CSSProperties`
- `descriptions: ReactNode`
- `icon: ReactNode`
- `onAfterClose: fn`
- `onAfterOpen: fn`
- `onClose: fn`
- `onPrimaryButtonClick: fn`
- `onSecondaryButtonClick: fn`
- `primaryButtonProps: ButtonProps`
- `primaryButtonText: ReactNode`
- `resultPageClassName: string`
- `resultPageStyle: CSSProperties`
- `secondaryButtonProps: ButtonProps`
- `secondaryButtonText: ReactNode`
- `showCloseIcon: boolean`
- `status: 'success'|'warning'|'error'`
- `title: ReactNode`
- `visible: boolean`

## Drawer (8)

- `children: ReactNode`
- `closeIconStyle: CSSProperties`
- `contentStyle: CSSProperties`
- `onAfterClose: fn`
- `onAfterOpen: fn`
- `onClose: fn`
- `showCloseIcon: boolean`
- `visible: boolean`

## EsimPolicyAgree (6)

- `children: ReactI18NextChildren | Iterable<ReactI18…`
- `esimConditionKey: string`
- `manifest: string`
- `onChange: fn`
- `preSlot: ReactNode`
- `title: string`

## FeedbackComment (11)

- `comment: string`
- `commentProps: Omit<LabelTextAreaProps, 'value' | 'defa…`
- `defaultComment: string`
- `defaultSelectedTags: Array<string>`
- `description: string`
- `onChange: fn`
- `selectedTags: Array<string>`
- `showComment: boolean`
- `showTags: boolean`
- `tagOptions: Array<CheckboxButtonGroupProps['options'…`
- `tagsProps: Omit<CheckboxButtonGroupProps, 'options'…`

## FilterPanel (10)

- `block: boolean`
- `confirmText: string`
- `description: ReactNode`
- `groups: FilterItem[]`
- `mode: 'single'|'multiple'`
- `onApply: fn`
- `onClose: fn`
- `resetText: string`
- `title: ReactNode`
- `visible: boolean`

## FlightCard (7)

- `airline: ReactNode`
- `airlineLogo: ReactNode`
- `description: ReactNode`
- `flightNumber: ReactNode`
- `flightType: ReactNode`
- `from: airlineItem`
- `to: airlineItem`

## Form (17)

- `children: ReactNode`
- `disabled: boolean`
- `footer: ReactNode`
- `form: FormInstance<Values>`
- `hasFeedback: boolean`
- `initialValues: Store`
- `layout: 'vertical'|'horizontal'`
- `mode: 'default'|'card'`
- `name: string`
- `onFieldsChange: fn`
- `onFinish: fn`
- `onFinishFailed: fn`
- `onValuesChange: fn`
- `preserve: boolean`
- `requiredMarkStyle: 'asterisk'|'text-required'|'text-optional'|'none'`
- `validateMessages: ValidateMessages`
- `validateTrigger: string | string[] | false`

## Guide (7)

- `fallbackImage: string`
- `imageHeight: number|string`
- `imageWidth: number|string`
- `indicator: fn`
- `onIndexChange: fn`
- `steps: ReactNode`
- `title: ReactNode`

## Image (20)

- `alt: string`
- `children: ReactI18NextChildren | Iterable<ReactI18…`
- `containerWidth: number`
- `crossOrigin: ''|'anonymous'|'use-credentials'`
- `decoding: 'auto'|'async'|'sync'`
- `draggable: boolean`
- `fallback: ReactNode`
- `fetchPriority: 'auto'|'high'|'low'`
- `fit: 'fill'|'none'|'contain'|'cover'|'scale-down'`
- `height: number|string`
- `loading: 'eager'|'lazy'`
- `referrerPolicy: ''|'no-referrer'|'no-referrer-when-downgrade'|'origin'|'origin-when-cross-origin'|'same-origin'|'strict-origin'|'strict-origin-when-cross-origin'|'unsafe-url'`
- `showSkeleton: boolean`
- `sizes: string`
- `skeletonProps: React.ComponentProps<typeof Skeleton>`
- `src: string`
- `srcSet: string`
- `transformMethod: fn`
- `useMap: string`
- `width: number|string`

## ImageViewer (13)

- `afterClose: fn`
- `classNames: {
        mask?: string;
        body?: …`
- `defaultIndex: number`
- `getContainer: GetContainer`
- `imageRender: fn`
- `images: string | string[]`
- `maxZoom: number|string`
- `onClose: fn`
- `onIndexChange: fn`
- `renderFooter: fn`
- `showCloseIcon: boolean`
- `showDefaultFooter: boolean`
- `visible: boolean`

## IntlTelInput (21)

- `areaCode: string`
- `areaCodeStyle: CSSProperties`
- `areaPlaceholder: string`
- `countryDataSource: CountryItemType[]`
- `countryFilterOption: fn`
- `countryRenderItem: fn`
- `countrySearchLocale: string`
- `countrySearchProps: Partial<
        Omit<CountrySearchProps…`
- `countrySearchTitle: string`
- `inputProps: LabelInputProps`
- `onCountrySearchChange: fn`
- `onCountrySearchEnter: fn`
- `onCountrySelect: fn`
- `onPhoneNumChange: fn`
- `onSelectAreaCode: fn`
- `phoneNum: string`
- `phoneNumStyle: CSSProperties`
- `placeholder: string`
- `regionalFlag: string`
- `showCountrySearch: boolean`
- `showFlag: boolean`

## Journey (1)

- `items: ReactNode`

## LabelInput (23)

- `autoComplete: HTMLInputAutoCompleteAttribute | undefin…`
- `clearIcon: ReactNode`
- `clearable: boolean`
- `defaultValue: string`
- `disabled: boolean`
- `max: number`
- `maxLength: number`
- `min: number`
- `minLength: number`
- `name: string`
- `onChange: fn`
- `onClear: fn`
- `onEnterPress: fn`
- `onlyShowClearWhenFocus: boolean`
- `pattern: string`
- `placeholder: string`
- `prefix: ReactNode`
- `readOnly: boolean`
- `required: boolean`
- `step: number|string`
- `suffix: ReactNode`
- `type: HTMLInputTypeAttribute | undefined`
- `value: string`

## LabelTextArea (18)

- `autoComplete: string`
- `autoSize: boolean | {
        minRows?: number;
  …`
- `defaultValue: string`
- `disabled: boolean`
- `enterKeyHint: 'search'|'enter'|'done'|'go'|'next'|'previous'|'send'`
- `label: ReactNode`
- `labelPosition: 'inside'|'outside'`
- `maxLength: number`
- `name: string`
- `onChange: fn`
- `onEnterPress: fn`
- `placeholder: string`
- `readOnly: boolean`
- `required: boolean`
- `rows: number`
- `showCount: ReactNode`
- `suffix: ReactNode`
- `value: string`

## LinkCard (5)

- `content: ReactNode`
- `onClick: fn`
- `prefix: ReactNode`
- `suffix: ReactNode`
- `text: string`

## Link (3)

- `children: ReactNode`
- `onClick: fn`
- `url: string`

## Modal (11)

- `children: ReactNode`
- `closeIconStyle: CSSProperties`
- `closeOnMaskClick: boolean`
- `contentStyle: CSSProperties`
- `description: ReactNode`
- `onAfterClose: fn`
- `onAfterOpen: fn`
- `onClose: fn`
- `showCloseIcon: boolean`
- `title: ReactNode`
- `visible: boolean`

## NavHeader (12)

- `actions: Action[]`
- `backIconColor: string`
- `container: HTMLElement`
- `leftContent: ReactNode`
- `liked: boolean`
- `mode: 'fixed'|'static'`
- `onGoBack: fn`
- `onLike: fn`
- `rightContent: ReactNode`
- `showForce: boolean`
- `theme: 'light'|'dark'`
- `title: string`

## Nps (21)

- `comment: string`
- `defaultComment: string`
- `defaultRate: number`
- `defaultSelectedTags: FeedbackCommentProps['defaultSelectedTag…`
- `dialogCancelText: string`
- `dialogDescription: string`
- `dialogSubmitText: string`
- `dialogTitle: string`
- `feedbackCommentProps: Omit<FeedbackCommentProps, 'tagOptions' …`
- `isSubmitted: boolean`
- `onChange: fn`
- `onSubmit: fn`
- `rate: number`
- `rateDescription: string`
- `rateProps: Omit<RateProps, 'value' | 'defaultValue'…`
- `rateSubmitButtonText: string`
- `rateTitle: string`
- `selectedTags: FeedbackCommentProps['selectedTags']`
- `submittedDescription: string`
- `submittedTitle: string`
- `tagOptions: FeedbackCommentProps['tagOptions']`

## NumberStepper (16)

- `allowEmpty: boolean`
- `defaultValue: ValueType`
- `description: ReactNode`
- `digits: number`
- `disabled: boolean`
- `footer: ReactNode`
- `formatter: fn`
- `inputReadOnly: boolean`
- `label: ReactNode`
- `max: ValueType`
- `min: ValueType`
- `onChange: fn`
- `parser: fn`
- `step: ValueType`
- `stringMode: boolean`
- `value: ValueType`

## Overview (3)

- `items: DataRowProps[]`
- `showItemDivider: boolean`
- `showSkeleton: boolean`

## PayCard (15)

- `cardBrand: string`
- `cardHolderName: string`
- `cardType: 'visa'|'mastercard'|'amex'|'bankcard'`
- `disabled: boolean`
- `expired: boolean`
- `expiryMonth: string`
- `expiryYear: string`
- `onAddPayCard: Function`
- `onChange: Function`
- `onSuccess: fn`
- `payCardLast4: string`
- `prefix: ReactNode`
- `showCardIcon: boolean`
- `statusLabel: string`
- `suffix: ReactNode`

## Payment (20)

- `allowEmpty: boolean`
- `defaultValue: ValueType`
- `description: ReactNode`
- `digits: number`
- `disabled: boolean`
- `footer: ReactNode`
- `formatter: fn`
- `inputReadOnly: boolean`
- `label: ReactNode`
- `max: number`
- `min: number`
- `notice: ReactNode`
- `onChange: fn`
- `parser: fn`
- `step: ValueType`
- `stepperRender: fn`
- `stringMode: boolean`
- `title: string`
- `total: number`
- `value: number`

## PolicyAgree (6)

- `children: ReactI18NextChildren | Iterable<ReactI18…`
- `debounceTime: number`
- `manifest: string`
- `onChange: fn`
- `preSlot: ReactNode`
- `title: string`

## ProductRecommend (3)

- `direction: 'vertical'|'horizontal'`
- `items: ProductRecommendItem[]`
- `onClick: fn`

## ProductSelect (7)

- `checkboxPosition: 'left'|'right'`
- `direction: 'vertical'|'horizontal'`
- `itemList: ProductSelectInfo[]`
- `multiple: boolean`
- `onChange: fn`
- `showCheckbox: boolean`
- `value: ValueType`

## ProgressBar (3)

- `percent: number`
- `rounded: boolean`
- `text: ReactNode`

## ProgressCircle (7)

- `fillColor: string | { percent: number; color: strin…`
- `isSemiCircle: boolean`
- `percent: number`
- `size: number`
- `text: ReactNode`
- `textPosition: 'inside'|'top'|'bottom'`
- `trackWidth: number`

## ProgressSegment (7)

- `currentStep: number`
- `percent: number`
- `prefix: ReactNode`
- `rounded: boolean`
- `text: ReactNode`
- `textPosition: 'top'|'bottom'`
- `totalSteps: number`

## QrCode (23)

- `bgColor: string`
- `bordered: boolean`
- `caption: ReactNode`
- `captionClassName: string`
- `captionStyle: CSSProperties`
- `color: string`
- `containerWidth: number`
- `errorLevel: 'L'|'M'|'Q'|'H'`
- `icon: ReactNode`
- `iconRadius: number`
- `iconSize: number`
- `loading: boolean`
- `onRefresh: fn`
- `provider: ReactNode`
- `providerDescription: string`
- `qrCodeClassName: string`
- `showRefreshButton: boolean`
- `size: number`
- `status: 'loading'|'active'|'expired'|'scanned'`
- `statusRender: fn`
- `transformMethod: fn`
- `type: 'image'|'canvas'|'svg'`
- `value: string`

## RadioButtonGroup (7)

- `align: 'left'|'center'`
- `allowClear: boolean`
- `defaultValue: string`
- `disabled: boolean`
- `onChange: fn`
- `options: Array<RadioButtonOptionItem>`
- `value: string`

## RadioButton (8)

- `allowClear: boolean`
- `checked: boolean`
- `defaultChecked: boolean`
- `disabled: boolean`
- `label: ReactNode`
- `onChange: fn`
- `prefix: ReactNode`
- `suffix: ReactNode`

## Radio (9)

- `block: boolean`
- `checked: boolean`
- `children: ReactNode`
- `defaultChecked: boolean`
- `disabled: boolean`
- `icon: fn`
- `onChange: fn`
- `onClick: fn`
- `value: number|string`

## Rate (11)

- `activeColor: string`
- `allowClear: boolean`
- `allowHalf: boolean`
- `count: number`
- `defaultValue: number`
- `disabled: boolean`
- `inactiveColor: string`
- `onChange: fn`
- `readOnly: boolean`
- `renderCharacter: fn`
- `value: number`

## ResultPage (13)

- `buttonsDirection: 'vertical'|'horizontal'`
- `children: ReactI18NextChildren | Iterable<ReactI18…`
- `contentAlign: 'left'|'center'|'right'`
- `descriptions: ReactNode`
- `icon: ReactNode`
- `onPrimaryButtonClick: fn`
- `onSecondaryButtonClick: fn`
- `primaryButtonProps: ButtonProps`
- `primaryButtonText: ReactNode`
- `secondaryButtonProps: ButtonProps`
- `secondaryButtonText: ReactNode`
- `status: 'success'|'warning'|'error'`
- `title: ReactNode`

## SafeArea (1)

- `position: 'top'|'bottom'`

## ScrollView (21)

- `allowTouchMove: boolean`
- `autoplay: boolean | "reverse" | undefined`
- `autoplayInterval: number`
- `children: ReactNode`
- `defaultIndex: number`
- `direction: 'vertical'|'horizontal'`
- `emptyContent: ReactNode`
- `indicator: ReactNode`
- `indicatorProps: Pick<import("../page-indicator").PageInd…`
- `itemStyle: CSSProperties`
- `items: Record<string, any>[] | string[]`
- `loop: boolean`
- `onIndexChange: fn`
- `onItemClick: fn`
- `renderItem: fn`
- `rubberband: boolean`
- `slideSize: number`
- `stopPropagation: ("mousedown" | "mousemove" | "mouseup")[…`
- `stuckAtBoundary: boolean`
- `total: number`
- `trackOffset: number`

## SearchBar (22)

- `autoComplete: HTMLInputAutoCompleteAttribute | undefin…`
- `clearIcon: ReactNode`
- `clearable: boolean`
- `defaultValue: string`
- `disabled: boolean`
- `max: number`
- `maxLength: number`
- `min: number`
- `minLength: number`
- `name: string`
- `onChange: fn`
- `onClear: fn`
- `onEnterPress: fn`
- `onlyShowClearWhenFocus: boolean`
- `pattern: string`
- `placeholder: string`
- `readOnly: boolean`
- `rounded: boolean`
- `searchIcon: ReactNode`
- `step: number|string`
- `type: HTMLInputTypeAttribute | undefined`
- `value: string`

## SearchList (17)

- `activeTabKey: string`
- `clearIcon: ReactNode`
- `dataSource: DataSource[] | ListItem[]`
- `defaultDataSource: DataSource[] | ListItem[]`
- `emptyContent: ReactNode`
- `hideSingleTabBar: boolean`
- `itemRender: fn`
- `loading: ReactNode`
- `onBlur: fn`
- `onChange: fn`
- `onClearRecentList: fn`
- `onEnterPress: fn`
- `onFocus: fn`
- `onTabChange: fn`
- `placeholder: string`
- `recentItemRender: fn`
- `recentList: ListItem[]`

## SecurePaymentInfo (3)

- `iconFontSize: number`
- `provider: string`
- `supportCards: ('visa' | 'masterCard' | 'amex')[]`

## Segmented (11)

- `block: boolean`
- `children: ReactI18NextChildren | Iterable<ReactI18…`
- `defaultValue: number|string`
- `description: string`
- `direction: 'ltr'|'rtl'`
- `disabled: boolean`
- `motionName: string`
- `onChange: fn`
- `options: SegmentedOption[]`
- `prefixCls: string`
- `value: number|string`

## SelectInput (15)

- `defaultValue: number|string`
- `disabled: boolean`
- `dropdownRender: fn`
- `emptyContent: ReactNode`
- `inputIcon: ReactNode`
- `inputStyle: CSSProperties`
- `maxHeight: number`
- `onChange: fn`
- `onOpenChange: fn`
- `optionRender: fn`
- `options: SelectInputOption[]`
- `placeholder: string`
- `selectedLabelRender: fn`
- `type: 'panel'|'dropdown'`
- `value: number|string`

## Sheet (11)

- `anchors: number[]`
- `children: ReactNode`
- `closeOnDragDown: boolean`
- `defaultHeight: number`
- `lockScroll: boolean`
- `onAnchorChange: fn`
- `onClose: fn`
- `onHeightChange: fn`
- `renderFooter: fn`
- `renderHeader: fn`
- `visible: boolean`

## Steps (3)

- `current: number`
- `direction: 'vertical'|'horizontal'`
- `items: StepItem[]`

## Swiper (25)

- `allowTouchMove: boolean`
- `autoplay: boolean | "reverse" | undefined`
- `autoplayInterval: number`
- `children: ReactNode`
- `containerStyle: CSSProperties`
- `defaultIndex: number`
- `direction: 'vertical'|'horizontal'`
- `fallbackImage: string`
- `height: number|string`
- `imageFit: 'fill'|'none'|'contain'|'cover'|'scale-down'`
- `imagesList: ContentImageItem[] | string[]`
- `indicator: fn`
- `indicatorProps: Pick<import("../page-indicator").PageInd…`
- `itemStyle: CSSProperties`
- `loop: boolean`
- `onIndexChange: fn`
- `onItemClick: fn`
- `rubberband: boolean`
- `skeletonProps: React.ComponentProps<typeof Skeleton>`
- `slideSize: number`
- `stopPropagation: ("mousedown" | "mousemove" | "mouseup")[…`
- `stuckAtBoundary: boolean`
- `total: number`
- `trackOffset: number`
- `width: number|string`

## Switch (9)

- `beforeChange: fn`
- `checked: boolean`
- `checkedText: ReactNode`
- `defaultChecked: boolean`
- `disabled: boolean`
- `loading: boolean`
- `onChange: fn`
- `type: 'inside'|'outside'`
- `uncheckedText: ReactNode`

## TabBar (5)

- `activeKey: string`
- `defaultActiveKey: string`
- `items: TabBarItem[]`
- `onChange: fn`
- `safeArea: boolean`

## Tabs (11)

- `activeKey: string`
- `activeLineMode: 'auto'|'fixed'|'full'`
- `autoScroll: boolean`
- `containerStyle: CSSProperties`
- `defaultActiveKey: string`
- `direction: 'ltr'|'rtl'`
- `items: TabItem[]`
- `onChange: fn`
- `stickyHeader: boolean`
- `stretch: boolean`
- `type: 'default'|'card'|'capsule'`

## Tag (4)

- `children: ReactNode`
- `round: boolean`
- `size: 'small'|'medium'`
- `theme: 'success'|'warning'|'info'|'muted'|'primary'|'danger'`

## TextArea (14)

- `autoComplete: string`
- `autoSize: boolean | {
        minRows?: number;
  …`
- `defaultValue: string`
- `disabled: boolean`
- `enterKeyHint: 'search'|'enter'|'done'|'go'|'next'|'previous'|'send'`
- `maxLength: number`
- `name: string`
- `onChange: fn`
- `onEnterPress: fn`
- `placeholder: string`
- `readOnly: boolean`
- `rows: number`
- `showCount: ReactNode`
- `value: string`

## Text (6)

- `animated: boolean`
- `children: ReactNode`
- `isTitle: boolean`
- `lineCount: number`
- `showSkeleton: boolean`
- `skeletonProps: React.ComponentProps<typeof AntdSkeleton…`

## TimePicker (17)

- `cancelText: string`
- `confirmText: string`
- `defaultValue: Date`
- `description: ReactNode`
- `footer: ReactNode`
- `format: string`
- `interval: number`
- `max: Date`
- `min: Date`
- `mouseWheel: boolean`
- `onChange: fn`
- `onClose: fn`
- `onConfirm: fn`
- `shouldDisableTime: fn`
- `title: ReactNode`
- `value: Date`
- `visible: boolean`

## TimeSelectPanel (16)

- `cancelButtonProps: Partial<ButtonProps>`
- `cancelText: string`
- `columns: number`
- `confirmButtonProps: Partial<ButtonProps>`
- `confirmText: string`
- `data: TimeDataItem[]`
- `description: ReactNode`
- `multiple: boolean`
- `onCancel: fn`
- `onChange: fn`
- `onClose: fn`
- `onConfirm: fn`
- `selectorOptions: Partial<SelectorProps<string>>`
- `title: ReactNode`
- `value: TimeValue`
- `visible: boolean`

## TimeSelect (18)

- `cancelButtonProps: Partial<ButtonProps>`
- `cancelText: string`
- `columns: number`
- `confirmButtonProps: Partial<ButtonProps>`
- `confirmText: string`
- `data: TimeDataItem[]`
- `defaultValue: TimeValue`
- `description: ReactNode`
- `disabled: boolean`
- `multiple: boolean`
- `onChange: fn`
- `placeholder: string`
- `prefix: ReactNode`
- `required: boolean`
- `showIcon: boolean`
- `suffix: ReactNode`
- `title: ReactNode`
- `value: TimeValue`

## Tour (8)

- `closeText: string`
- `current: number`
- `nextText: string`
- `onClose: fn`
- `onNext: fn`
- `open: boolean`
- `placement: 'left'|'right'|'top'|'bottom'`
- `steps: TourStep[]`

