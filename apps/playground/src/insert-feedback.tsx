/**
 * Feedback for click-to-add.
 *
 * Clicking a block in the drawer appends it to the END of the page. On any page taller than the
 * viewport that is invisible: the block really landed, it's just off-screen, which reads as "my
 * click did nothing" — so people click again and get two. Selecting it (the panel then names what
 * landed, ready to configure) and scrolling to it turns the append into something you watch happen.
 *
 * The toast is deliberately imperative DOM rather than component state: it has to survive the very
 * re-render it announces, and the drawer subtree is remounted by Puck whenever the editor re-renders
 * with a fresh `overrides` object — state there would be wiped before it ever painted.
 */

/** Puck's root content zone id (`${rootAreaId}:${rootZone}`). */
export const ROOT_ZONE = 'root:default-zone';

type Dispatch = (action: Record<string, unknown>) => void;

/**
 * Select the just-inserted block and bring it on screen. `id` is the node's `props.id`, which Puck
 * mirrors onto the canvas element as `data-puck-component`.
 */
export function revealInserted(dispatch: Dispatch, index: number, id?: string) {
    dispatch({ type: 'setUi', ui: { itemSelector: { index, zone: ROOT_ZONE } } });
    if (!id) return;
    // The node doesn't exist until Puck has re-rendered the document with it, which is not a fixed
    // delay away — a big page takes longer, and React is free to defer the commit. So poll for it,
    // and give up quietly if it never shows (nothing to scroll to). Timers rather than animation
    // frames: frame delivery is a rendering optimisation the browser can withhold, and this must not
    // silently do nothing when it does.
    let tries = 0;
    const scrollToIt = () => {
        const el = document.querySelector(`[data-puck-component="${CSS.escape(id)}"]`);
        if (!el) {
            if (tries++ < 40) window.setTimeout(scrollToIt, 32);
            return;
        }
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // A smooth scroll is an animation, so it can be cut short — the canvas re-laying out under it,
        // frames being withheld. Landing the block on screen matters more than the animation, so check
        // where we ended up and snap if it stalled.
        window.setTimeout(() => {
            const r = el.getBoundingClientRect();
            if (r.top >= window.innerHeight || r.bottom <= 0) el.scrollIntoView({ behavior: 'auto', block: 'center' });
        }, 700);
    };
    scrollToIt();
}

const TOAST_CSS =
    'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;' +
    'font-size:12.5px;font-weight:500;padding:9px 14px;border-radius:9px;white-space:nowrap;' +
    'box-shadow:0 8px 24px rgba(10,35,51,0.24);z-index:9999;pointer-events:none;' +
    'transition:opacity .18s ease;opacity:0';

let toastEl: HTMLDivElement | null = null;
let toastTimer = 0;

/**
 * A brief "what just landed" line. Names the block, because by the time you've scrolled you want to
 * know WHICH of the things you clicked is now selected. Re-firing reuses the one node, so adding
 * several blocks quickly doesn't stack toasts.
 */
export function showAddedToast(label: string) {
    if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.setAttribute('style', TOAST_CSS);
        document.body.appendChild(toastEl);
    }
    const el = toastEl;
    el.textContent = `Added ${label} to the end of the page`;
    void el.offsetHeight; // flush the opacity:0 base style so the transition to 1 actually animates
    el.style.opacity = '1';
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
        el.style.opacity = '0';
        window.setTimeout(() => el.remove(), 200);
        toastEl = null;
    }, 1800);
}
