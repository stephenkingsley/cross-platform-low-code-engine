/**
 * Media references for document content.
 *
 * An image-bearing prop value is a {@link MediaValue}: either a plain URL string or a
 * `{ $media: MediaRef }` object that carries a CMS asset id PLUS a denormalized snapshot
 * (url + dims). Hybrid by design — the runtime renders instantly from the snapshot, yet can
 * re-resolve by id for live updates. Mirrors the i18n {@link LocalizedString} pattern and is
 * provider-agnostic (a DAM / S3 source can reuse the shape). Plain URL strings keep working
 * unchanged, so this is fully backward-compatible.
 */

export interface MediaRef {
    /** Source system — `contentful` today; the shape itself is provider-agnostic. */
    provider: string;
    /** Asset kind. */
    kind: 'asset';
    /** Stable asset id, for live re-resolution. */
    id: string;
    /** Denormalized snapshot URL (absolute), for instant render. */
    url: string;
    alt?: string;
    width?: number;
    height?: number;
    contentType?: string;
}

/** An image prop value: a plain URL, or a hybrid media reference. */
export type MediaValue = string | { $media: MediaRef };

/** True when a value is a `{ $media }` reference (vs a plain URL string). */
export function isMediaRef(value: unknown): value is { $media: MediaRef } {
    return (
        value != null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof (value as { $media?: unknown }).$media === 'object' &&
        (value as { $media?: unknown }).$media != null
    );
}

/**
 * Resolve a possibly-referenced image value to a URL string for rendering (snapshot-first).
 * Plain strings pass through unchanged.
 *
 * Only call this for values that are meant to be images (the caller knows the field is an
 * `image`), so a `{ $media }` object is unambiguously a media reference.
 */
export function resolveMedia(value: unknown): unknown {
    if (isMediaRef(value)) return value.$media.url ?? '';
    return value;
}
