import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import { RouterProvider } from '@/lib/router';
import '@/app/globals.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider>
      <App />
    </RouterProvider>
  </React.StrictMode>
);
