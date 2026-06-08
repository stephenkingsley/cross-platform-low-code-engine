import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@puckeditor/core/puck.css';
import './puck-theme.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
