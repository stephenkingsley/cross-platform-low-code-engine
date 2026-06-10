/**
 * Data binding — map a server response (raw rows) to a component's item shape via a
 * declarative field map. The PROJECT fetches raw data and passes it to the runtime under a
 * binding id; the document carries only the map config (no data). Editor preview + runtime
 * share THIS engine, so what ops configures is exactly what renders. Same philosophy as
 * i18n / $media / actions: shaping is data the host resolves, the document stays portable.
 */

/**
 * One field's mapping rule. A bare string is a path (`a.b`) or a template — and templates
 * support inline FILTERS (pipes): `{{ status | map: OK=success, BAD=error | default: neutral }}`,
 * `{{ createTime | datetime }}`, `{{ orderNo | encode }}`. Filters chain left → right and make
 * branching / formatting / URL-building fully ops-editable, no code. See {@link applyTemplate}.
 */
export type MapRule =
    | string
    | {
          /** Read this dot-path from the raw row. */
          path?: string;
          /** A template with `{{path}}` placeholders. */
          template?: string;
          /** A literal value (string leaves still get `{{path}}` substitution). */
          const?: unknown;
          /** Built-in formatter applied to the value. */
          format?: 'date' | 'datetime' | 'time';
          /** Map a raw value → an output (e.g. status → tone). */
          valueMap?: Record<string, unknown>;
          /** Fallback when the result is empty / unmapped. */
          default?: unknown;
          /** Name of a host-registered transform function (the escape hatch). */
          transform?: string;
      };

/** card field → rule. */
export type FieldMap = Record<string, MapRule>;

/** A component's data binding: which source + how to map it. */
export interface DataBinding {
    /** Binding id — the project passes its raw array under this key. */
    source?: string;
    /** Field map: card field → rule. */
    fields?: FieldMap;
    /**
     * Design-time sample rows (a pasted server response). The editor uses these to DISCOVER
     * fields and render a live preview. The runtime IGNORES this entirely — it maps the real
     * data passed under {@link DataBinding.source}. Optional, and safe to ship in the doc.
     */
    sample?: unknown[];
}

/** Host-registered transform functions (the escape hatch for complex derivations). */
export type TransformFns = Record<string, (value: unknown, raw: Record<string, unknown>) => unknown>;

/** Read a dot-path (`a.b.c`) out of an object. */
export function getByPath(obj: unknown, path: string): unknown {
    if (!path) return undefined;
    let cur: unknown = obj;
    for (const key of path.split('.')) {
        if (cur == null || typeof cur !== 'object') return undefined;
        cur = (cur as Record<string, unknown>)[key];
    }
    return cur;
}

// A `{{ … }}` slot can hold a path plus piped filters; capture the whole inner expression.
const TEMPLATE_RE = /\{\{\s*([^}]+?)\s*\}\}/g;
const HAS_TEMPLATE = /\{\{[^}]+\}\}/;
const hasTemplate = (s: string) => HAS_TEMPLATE.test(s);

/** One-line cheatsheet of the built-in filters (the editor shows this under template inputs). */
export const TEMPLATE_FILTER_HINT = 'map:A=x,B=y · default:x · date · datetime · time · encode · upper · lower';

interface TemplateFilter {
    name: string;
    arg: string;
}

/** Split a `{{ … }}` expression into its leading path and the chain of filters after each `|`. */
function parseExpr(expr: string): { path: string; filters: TemplateFilter[] } {
    const parts = expr.split('|');
    const filters = parts.slice(1).map((seg): TemplateFilter => {
        const i = seg.indexOf(':');
        return i === -1 ? { name: seg.trim(), arg: '' } : { name: seg.slice(0, i).trim(), arg: seg.slice(i + 1).trim() };
    });
    return { path: parts[0].trim(), filters };
}

/** Parse a `map:` argument (`A=x, B=y`) into a lookup object. */
function parseMapArg(arg: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const pair of arg.split(',')) {
        const i = pair.indexOf('=');
        if (i !== -1) out[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
    }
    return out;
}

/** Apply one filter to a value. Unknown filters pass the value through unchanged. */
function applyFilter(value: unknown, f: TemplateFilter, raw: Record<string, unknown>, transforms?: TransformFns): unknown {
    switch (f.name) {
        case 'map': {
            const m = parseMapArg(f.arg);
            const k = value == null ? '' : String(value);
            return k in m ? m[k] : undefined; // miss → undefined so a following `default` can catch it
        }
        case 'default':
            return value == null || value === '' ? f.arg : value;
        case 'date':
        case 'datetime':
        case 'time':
            return formatValue(value, f.name);
        case 'upper':
            return value == null ? value : String(value).toUpperCase();
        case 'lower':
            return value == null ? value : String(value).toLowerCase();
        case 'encode':
            return value == null ? '' : encodeURIComponent(String(value));
        case 'transform': // escape hatch → a host-registered function
            return f.arg && transforms?.[f.arg] ? transforms[f.arg](value, raw) : value;
        default:
            return value;
    }
}

/** Substitute `{{ path | filter:arg | … }}` slots, reading paths from `raw` and piping filters. */
function applyTemplate(tpl: string, raw: unknown, transforms?: TransformFns): string {
    const row = (raw ?? {}) as Record<string, unknown>;
    return tpl.replace(TEMPLATE_RE, (_m, expr: string) => {
        const { path, filters } = parseExpr(expr);
        let v: unknown = getByPath(row, path);
        for (const f of filters) v = applyFilter(v, f, row, transforms);
        return v == null ? '' : String(v);
    });
}

/** Recursively substitute templates in every string leaf of a value. */
function deepTemplate(value: unknown, raw: unknown, transforms?: TransformFns): unknown {
    if (typeof value === 'string') return hasTemplate(value) ? applyTemplate(value, raw, transforms) : value;
    if (Array.isArray(value)) return value.map((v) => deepTemplate(v, raw, transforms));
    if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) out[k] = deepTemplate(v, raw, transforms);
        return out;
    }
    return value;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function formatValue(v: unknown, fmt: 'date' | 'datetime' | 'time'): unknown {
    const d = v instanceof Date ? v : new Date(v as string | number);
    if (Number.isNaN(d.getTime())) return v;
    const dd = String(d.getDate()).padStart(2, '0');
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (fmt === 'date') return `${dd} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    if (fmt === 'time') return time;
    return `${dd} ${MONTHS[d.getMonth()]} ${d.getFullYear()} • ${time}`;
}

function resolveRule(raw: Record<string, unknown>, rule: MapRule, transforms?: TransformFns): unknown {
    if (typeof rule === 'string') {
        return hasTemplate(rule) ? applyTemplate(rule, raw, transforms) : getByPath(raw, rule);
    }
    let v: unknown;
    if (rule.const !== undefined) v = deepTemplate(rule.const, raw, transforms);
    else if (rule.template != null) v = applyTemplate(rule.template, raw, transforms);
    else if (rule.path != null) v = getByPath(raw, rule.path);
    if (rule.transform && transforms?.[rule.transform]) v = transforms[rule.transform](v, raw);
    if (rule.format) v = formatValue(v, rule.format);
    if (rule.valueMap) {
        const mapped = v == null ? undefined : rule.valueMap[String(v)];
        v = mapped !== undefined ? mapped : rule.default ?? v;
    }
    if ((v === undefined || v === null || v === '') && rule.default !== undefined) v = rule.default;
    return v;
}

/** Map one raw row → a component item per the field map. */
export function mapItem(
    raw: Record<string, unknown>,
    fields: FieldMap,
    transforms?: TransformFns,
): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [field, rule] of Object.entries(fields)) out[field] = resolveRule(raw, rule, transforms);
    return out;
}

/** Map a raw server array → component items via the field map. */
export function resolveBinding(
    rawArray: unknown,
    fields: FieldMap | undefined,
    transforms?: TransformFns,
): Record<string, unknown>[] {
    if (!Array.isArray(rawArray) || !fields) return [];
    return rawArray.map((raw) => mapItem((raw ?? {}) as Record<string, unknown>, fields, transforms));
}

/** True when a value is a usable {@link DataBinding} (has a non-empty source). */
export function isDataBinding(value: unknown): value is DataBinding {
    return (
        !!value &&
        typeof value === 'object' &&
        typeof (value as DataBinding).source === 'string' &&
        !!(value as DataBinding).source
    );
}

// ---- design-time introspection (editor only) --------------------------------

/** One field discovered in a sample response — a dot-path, its coarse type + a sample value. */
export interface DiscoveredField {
    /** Dot-path into a row (e.g. `airport.code`). */
    path: string;
    /** Coarse JSON type. */
    type: 'string' | 'number' | 'boolean' | 'array' | 'null';
    /** A sample value (from the first row that has one). */
    sample: unknown;
}

function jsonLeafType(v: unknown): DiscoveredField['type'] {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    const t = typeof v;
    if (t === 'number') return 'number';
    if (t === 'boolean') return 'boolean';
    return 'string';
}

/**
 * Flatten a pasted sample response into a list of bindable leaf fields (dot-paths). Recurses
 * plain objects, treats arrays as leaves, and unions keys across the first few rows so an
 * occasionally-missing field is still surfaced. Powers the editor's field-mapping dropdowns.
 */
export function introspectSample(rows: unknown): DiscoveredField[] {
    const arr = Array.isArray(rows) ? rows : rows != null ? [rows] : [];
    const seen = new Map<string, DiscoveredField>();
    const walk = (obj: unknown, prefix: string) => {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
            const path = prefix ? `${prefix}.${k}` : k;
            if (v && typeof v === 'object' && !Array.isArray(v)) {
                walk(v, path); // recurse plain objects (container itself isn't bindable)
            } else if (!seen.has(path) || seen.get(path)!.sample == null) {
                seen.set(path, { path, type: jsonLeafType(v), sample: v });
            }
        }
    };
    for (const row of arr.slice(0, 5)) walk(row, '');
    return [...seen.values()];
}
