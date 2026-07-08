/**
 * Create (or update) the page content type the builder edits, then publish it.
 *
 * The app's Entry-editor location binds to a content type id (default `lcePage`, or whatever
 * you set on the app config screen, e.g. `pandoraBox`). That content type must EXIST before the
 * app can be assigned to it — otherwise install shows "could not be assigned to the content
 * model". This script creates it with the three fields the runtime reads: `name`, `slug`,
 * `document` (the JSON Object that stores the builder's page document).
 *
 * Usage (a Content-Management — CMA — token, NOT the read-only CPA preview token):
 *
 *   CONTENTFUL_CMA_TOKEN=cfpat-xxxx pnpm run setup:model pandoraBox
 *
 * Space id + environment fall back to the .env's VITE_CONTENTFUL_SPACE_ID / _ENVIRONMENT, so you
 * usually only pass the CMA token + the content-type id. Re-running is safe (idempotent update).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from 'contentful-management';

const here = dirname(fileURLToPath(import.meta.url));

/** Tiny .env reader (no dotenv dep) — KEY=VALUE lines, strips quotes, ignores comments. */
function readEnvFile(path) {
    try {
        const out = {};
        for (const line of readFileSync(path, 'utf8').split('\n')) {
            const m = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
            if (m && !line.trimStart().startsWith('#')) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
        return out;
    } catch {
        return {};
    }
}

const fileEnv = readEnvFile(join(here, '..', '.env'));
const pick = (k) => process.env[k] || fileEnv[k];

const spaceId = pick('CONTENTFUL_SPACE_ID') || pick('VITE_CONTENTFUL_SPACE_ID');
const environmentId = pick('CONTENTFUL_ENVIRONMENT') || pick('VITE_CONTENTFUL_ENVIRONMENT') || 'master';
const accessToken = pick('CONTENTFUL_CMA_TOKEN'); // management token — never a VITE_ var
const contentTypeId = process.argv[2] || pick('CONTENT_TYPE_ID') || 'lcePage';

if (!accessToken || !spaceId) {
    console.error(
        'Missing config. Set a CMA token + space id, e.g.\n' +
            '  CONTENTFUL_CMA_TOKEN=cfpat-xxxx pnpm run setup:model ' + contentTypeId + '\n' +
            '(space id is read from .env VITE_CONTENTFUL_SPACE_ID if present; CMA token is a\n' +
            ' Content Management token — Account Settings → Tokens → Personal access tokens.)',
    );
    process.exit(1);
}

const FIELDS = [
    { id: 'name', name: 'Name', type: 'Symbol', required: false, localized: false },
    { id: 'slug', name: 'Slug', type: 'Symbol', required: false, localized: false },
    // The page document the builder produces; the runtime renders it. JSON Object field.
    { id: 'document', name: 'Document', type: 'Object', required: false, localized: false },
];

const main = async () => {
    const client = createClient({ accessToken });
    const space = await client.getSpace(spaceId);
    const env = await space.getEnvironment(environmentId);

    let ct = null;
    try {
        ct = await env.getContentType(contentTypeId);
    } catch {
        ct = null;
    }

    const data = { name: 'Pandora Box Page', description: 'Low-code page edited by the DragonPass Page Builder app.', displayField: 'name', fields: FIELDS };

    if (ct) {
        ct.name = data.name;
        ct.description = data.description;
        ct.displayField = data.displayField;
        ct.fields = FIELDS;
        ct = await ct.update();
        console.log(`↻ updated content type "${contentTypeId}"`);
    } else {
        ct = await env.createContentTypeWithId(contentTypeId, data);
        console.log(`+ created content type "${contentTypeId}"`);
    }

    await ct.publish();
    console.log(
        `✓ published "${contentTypeId}" in ${spaceId}/${environmentId} (fields: name, slug, document).\n` +
            '  Next: open the app config screen, set Content type id = "' + contentTypeId + '", Save —\n' +
            '  that assigns the app as this type\'s Entry editor (no more "could not be assigned" warning).',
    );
};

main().catch((e) => {
    console.error('setup:model failed:', e?.message || e);
    process.exit(1);
});
