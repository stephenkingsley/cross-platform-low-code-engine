/**
 * One-off: read every dp-design Storybook story and print each component's
 * `argTypes` (the props Storybook exposes as controls) → a complete inventory.
 */
import path from 'node:path';
import { Node, Project, ts } from 'ts-morph';

const DP = '/Users/kingsleystephen/Documents/project/dp-design/packages/atom-ui-mobile';

const project = new Project({
    compilerOptions: { jsx: ts.JsxEmit.React, allowJs: true },
    skipAddingFilesFromTsConfig: true,
});
project.addSourceFilesAtPaths(`${DP}/src/stories/*.stories.{ts,tsx}`);

const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim();

let totalProps = 0;
const rows: string[] = [];

const files = project
    .getSourceFiles()
    .sort((a, b) => a.getBaseName().localeCompare(b.getBaseName()));

for (const sf of files) {
    const name = sf.getBaseName().replace(/\.stories\.(ts|tsx)$/, '');

    // Find the first `argTypes: { ... }` object literal in the file (the meta).
    let argTypes: import('ts-morph').ObjectLiteralExpression | undefined;
    sf.forEachDescendant((node) => {
        if (argTypes) return;
        if (
            Node.isPropertyAssignment(node) &&
            node.getName().replace(/['"]/g, '') === 'argTypes'
        ) {
            const init = node.getInitializer();
            if (init && Node.isObjectLiteralExpression(init)) argTypes = init;
        }
    });

    const props: string[] = [];
    if (argTypes) {
        for (const p of argTypes.getProperties()) {
            if (!Node.isPropertyAssignment(p) && !Node.isShorthandPropertyAssignment(p)) continue;
            const key = p.getName().replace(/['"]/g, '');
            let control = '';
            let options = '';
            if (Node.isPropertyAssignment(p)) {
                const v = p.getInitializer();
                if (v && Node.isObjectLiteralExpression(v)) {
                    const ctrl = v.getProperty('control');
                    if (ctrl && Node.isPropertyAssignment(ctrl))
                        control = oneLine(ctrl.getInitializer()?.getText() ?? '');
                    const opt = v.getProperty('options');
                    if (opt && Node.isPropertyAssignment(opt))
                        options = oneLine(opt.getInitializer()?.getText() ?? '');
                }
            }
            const suffix = [control && `control=${control}`, options && `options=${options}`]
                .filter(Boolean)
                .join(' ');
            props.push(`    - ${key}${suffix ? `  (${suffix})` : ''}`);
        }
    }
    totalProps += props.length;
    rows.push(`\n## ${name}  [${props.length} props${argTypes ? '' : ', NO argTypes'}]`);
    rows.push(...props);
}

console.log(rows.join('\n'));
console.log(`\n\n=== ${files.length} stories, ${totalProps} prop controls total ===`);
