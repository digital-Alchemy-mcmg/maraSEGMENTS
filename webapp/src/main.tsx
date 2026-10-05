import App from '@root/App';
import { createRoot } from 'react-dom/client';

// Wait for storage cache to hydrate from MFE before rendering
// so that any component reading localStorage on mount gets real data
declare global {
  interface Window {
    _storageReady: Promise<void>;
  }
}

window._storageReady.then(() => {
  createRoot(document.querySelector('#root')!).render(<App />);
});
