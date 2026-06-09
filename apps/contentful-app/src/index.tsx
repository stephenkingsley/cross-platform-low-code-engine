import { createRoot } from 'react-dom/client';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import '@puckeditor/core/puck.css';
import './puck-theme.css';
import App from './App';
import LocalhostWarning from './components/LocalhostWarning';
import { PreviewPage } from './preview';

const container = document.getElementById('root')!;
const root = createRoot(container);

const params = new URLSearchParams(window.location.search);
const previewEntryId = params.get('entryId');

if (previewEntryId) {
    // Content-preview mode: standalone render of an entry's document (no App SDK).
    // Contentful gives locales like "en-US" / "zh-CN"; the document's i18n uses "en" / "zh".
    const locale = (params.get('locale') ?? 'en-US').split('-')[0];
    root.render(<PreviewPage entryId={previewEntryId} locale={locale} />);
} else if (import.meta.env.DEV && window.self === window.top) {
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
