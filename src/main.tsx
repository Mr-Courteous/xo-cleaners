import './polyfills';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ColorsProvider } from './state/ColorsContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorsProvider>
      <App />
    </ColorsProvider>
  </StrictMode>
);
