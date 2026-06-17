import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.innerHTML =
    '<p style="font-family:system-ui,sans-serif;padding:2rem;color:#333">PyTyping could not start: missing #root element.</p>';
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
