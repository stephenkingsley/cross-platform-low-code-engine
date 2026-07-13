import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@puckeditor/core/puck.css';
import './puck-theme.css';
import { App } from './App';
import { configureRem } from 'pandora-box-layout';

configureRem({ convert: (px) => `${px}px` });

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
