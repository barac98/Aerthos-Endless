import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { useGameStore } from './store/useGameStore';

// Register service worker for PWA
registerSW({ 
  immediate: true,
  onNeedRefresh() {
    console.log('[Aerthos] New version detected, update available.');
    useGameStore.getState().setUpdateAvailable(true);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
