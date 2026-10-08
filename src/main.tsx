import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/outfit';
import '@fontsource-variable/jetbrains-mono';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <h1 className="p-10 text-6xl">
      Veyr <span className="text-gradient-primary">tokens</span>
    </h1>
  </StrictMode>,
);
