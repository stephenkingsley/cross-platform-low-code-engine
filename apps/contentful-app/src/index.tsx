import { createRoot } from 'react-dom/client';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import '@puckeditor/core/puck.css';
import './puck-theme.css';
import App from './App';
import LocalhostWarning from './components/LocalhostWarning';
import { PreviewPage } from './preview';
import { configureRem } from '@lce/layout';

const container = document.getElementById('root')!;
const root = createRoot(container);

const params = new URLSearchParams(window.location.search);
const previewEntryId = params.get('entryId');

if (previewEntryId) {
    // Content-preview mode: standalone render of an entry's document (no App SDK). Lock the rem base
    // to the 375px DESIGN width (1rem = 37.5px) so the page renders at MOBILE scale regardless of the
    // (desktop) preview window. amfe-flexible's `viewport/10` based the rem on the desktop window
    // instead, so every rem ballooned (a 180px swiper image → ~700px). toRem's default rootValue
    // (37.5) matches this base, so each module/font/spacing lands at its design px.
    // Contentful gives locales like "en-US" / "zh-CN"; the document's i18n uses "en" / "zh".
    const locale = (params.get('locale') ?? 'en-US').split('-')[0];
    document.documentElement.style.fontSize = '37.5px';
    root.render(<PreviewPage entryId={previewEntryId} locale={locale} />);
} else {
    // Builder canvas renders at fixed design px (predictable authoring); the runtime + the preview
    // above scale the same px→rem per device (shared toRem).
    configureRem({ convert: (px) => `${px}px` });
    if (import.meta.env.DEV && window.self === window.top) {
        // When opened directly (not inside Contentful's iframe) show a hint instead of a blank app.
        root.render(<LocalhostWarning />);
    } else {
        root.render(
            <SDKProvider>
                <GlobalStyles />
                <App />
            </SDKProvider>,
        );
    }
}
