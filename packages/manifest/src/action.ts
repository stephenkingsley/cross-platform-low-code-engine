/**
 * Declarative interactions for document content.
 *
 * The document is props-only JSON, so it can't carry real event-handler functions. Instead an
 * interactive component stores an {@link Action} — a small DATA descriptor of what a click
 * should do. The runtime turns it into a real `onClick` / `onPress` that calls the host's
 * `onAction` dispatcher, which interprets it (navigate, emit an app event, …). Mirrors the
 * i18n / `$media` pattern: behaviour is data the host resolves, so the document stays portable
 * (and works identically on web + React Native — only the dispatcher differs per platform).
 */

export type ActionTarget = '_self' | '_blank';

export type Action =
    | { type: 'navigate'; href: string; target?: ActionTarget }
    | { type: 'event'; name: string; payload?: Record<string, unknown> };

/** True when a value is a usable {@link Action} descriptor (so a stray `{}` is ignored). */
export function isAction(value: unknown): value is Action {
    if (value == null || typeof value !== 'object') return false;
    const a = value as { type?: unknown; href?: unknown; name?: unknown };
    if (a.type === 'navigate') return typeof a.href === 'string' && a.href.length > 0;
    if (a.type === 'event') return typeof a.name === 'string' && a.name.length > 0;
    return false;
}
