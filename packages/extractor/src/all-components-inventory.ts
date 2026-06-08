/**
 * One-off: resolve every exported `*Props` type from the dp-design barrel (follows
 * re-exports, incl. antd) and emit the full prop API per component. Writes a markdown
 * reference doc and prints a compact one-line-per-component summary.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Node, Project, type Symbol as TsSymbol, type Type } from 'ts-morph';

const DP = '/Users/kingsleystephen/Documents/project/dp-design/packages/atom-ui-mobile';
const ENGINE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const project = new Project({ tsConfigFilePath: path.join(DP, 'tsconfig.json') });
const barrel = project.getSourceFileOrThrow(path.join(DP, 'src/index.ts'));

const NOISE = new Set([
    'AriaAttributes',
    'DOMAttributes',
    'HTMLAttributes',
    'AllHTMLAttributes',
    'SVGAttributes',
    'SVGProps',
]);
const SKIP = new Set(['key', 'ref', 'id', 'tabIndex', 'role', 'className', 'style']);
const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim();

function declIface(sig: Node | undefined): string {
    const p = sig?.getParent();
    return p && Node.isInterfaceDeclaration(p) ? p.getName() : '';
}
function nonNull(t: Type): Type[] {
    const parts = t.isUnion() ? t.getUnionTypes() : [t];
    return parts.filter((x) => !x.isUndefined() && !x.isNull());
}
function shortType(t: Type, sig: Node | undefined): string {
    if (t.getCallSignatures().length) return 'fn';
    const declText = sig && Node.isPropertySignature(sig) ? (sig.getTypeNode()?.getText() ?? '') : '';
    if (/CSSProperties/.test(declText)) return 'CSSProperties';
    if (/ReactNode|ReactElement|JSX\.Element|ReactChild/.test(declText)) return 'ReactNode';
    const nn = nonNull(t);
    if (nn.length && (nn.some((x) => x.isBoolean()) || nn.every((x) => x.isBooleanLiteral()))) return 'boolean';
    if (nn.length && nn.every((x) => x.isStringLiteral())) return nn.map((x) => `'${x.getLiteralValue()}'`).join('|');
    if (nn.length && nn.every((x) => x.isNumber() || x.isNumberLiteral())) return 'number';
    if (nn.length && nn.every((x) => x.isString() || x.isStringLiteral())) return 'string';
    if (nn.length && nn.every((x) => x.isString() || x.isStringLiteral() || x.isNumber() || x.isNumberLiteral())) return 'number|string';
    const raw = declText || oneLine(t.getText());
    return raw.length > 40 ? `${raw.slice(0, 40)}…` : raw || 'unknown';
}

const names = [...barrel.getExportedDeclarations().keys()].filter((n) => /Props$/.test(n)).sort();
const entries: { comp: string; props: string[] }[] = [];
let grand = 0;

for (const typeName of names) {
    const decl = barrel
        .getExportedDeclarations()
        .get(typeName)!
        .find((d) => Node.isInterfaceDeclaration(d) || Node.isTypeAliasDeclaration(d));
    if (!decl) continue;
    let symbols: TsSymbol[] = [];
    try {
        symbols = decl.getType().getProperties();
    } catch {
        continue;
    }
    const props: string[] = [];
    for (const prop of symbols) {
        const name = prop.getName();
        if (SKIP.has(name)) continue;
        const sig = prop.getDeclarations().find(Node.isPropertySignature);
        if (name !== 'children' && NOISE.has(declIface(sig))) continue;
        const type = sig && Node.isPropertySignature(sig) ? sig.getType() : prop.getTypeAtLocation(decl);
        props.push(`${name}: ${shortType(type, sig)}`);
    }
    props.sort();
    grand += props.length;
    entries.push({ comp: typeName.replace(/Props$/, ''), props });
}

// Markdown reference doc
const md: string[] = [
    '# dp-design — full component prop inventory',
    '',
    `> ${entries.length} components · ${grand} props. Resolved from each \`*Props\` type (follows antd re-exports); generic DOM/aria/event noise (\`HTMLAttributes\`/\`AriaAttributes\`/\`DOMAttributes\`) filtered out. \`fn\` = function/event handler, \`ReactNode\` = slot.`,
    '',
];
for (const e of entries) {
    md.push(`## ${e.comp} (${e.props.length})`, '', e.props.map((p) => `- \`${p}\``).join('\n'), '');
}
const docPath = path.join(ENGINE_ROOT, 'docs/dp-design-components.md');
mkdirSync(path.dirname(docPath), { recursive: true });
writeFileSync(docPath, `${md.join('\n')}\n`, 'utf8');

// Compact console summary (prop names only)
for (const e of entries) {
    console.log(`${e.comp} [${e.props.length}]: ${e.props.map((p) => p.split(':')[0]).join(', ')}`);
}
console.log(`\n=== ${entries.length} components, ${grand} props → docs/dp-design-components.md ===`);
