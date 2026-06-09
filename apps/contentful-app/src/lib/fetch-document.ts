/** A `pandora-box` page entry's fields, as returned by the Contentful CDA/CPA. */
export interface PageEntryFields {
    name?: string;
    slug?: string;
    /** The page document the builder produced (the JSON the runtime renders). */
    document?: unknown;
}

/**
 * Fetch a page entry's fields from Contentful by id.
 *
 * Uses the Content **Preview** API by default (so unpublished drafts are visible — the whole
 * point of a content preview); pass `{ preview: false }` for the published CDN. Config comes
 * from Vite env vars (baked into the client at build — fine for a read-only preview token).
 */
export async function fetchPageEntry(
    entryId: string,
    opts: { preview?: boolean } = {},
): Promise<PageEntryFields | null> {
    const space = import.meta.env.VITE_CONTENTFUL_SPACE_ID as string | undefined;
    const env = (import.meta.env.VITE_CONTENTFUL_ENVIRONMENT as string | undefined) || 'master';
    const token = import.meta.env.VITE_CONTENTFUL_CPA_TOKEN as string | undefined;
    if (!space || !token) {
        throw new Error('Missing VITE_CONTENTFUL_SPACE_ID / VITE_CONTENTFUL_CPA_TOKEN (set them in .env)');
    }
    const host = opts.preview === false ? 'cdn.contentful.com' : 'preview.contentful.com';
    const res = await fetch(
        `https://${host}/spaces/${space}/environments/${env}/entries/${entryId}?access_token=${token}`,
    );
    if (!res.ok) {
        throw new Error(`Contentful ${res.status} ${res.statusText} for entry ${entryId}`);
    }
    const data = (await res.json()) as { fields?: PageEntryFields };
    return data.fields ?? null;
}
