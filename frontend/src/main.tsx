import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from '@/App';
import { RouterProvider } from '@/lib/router';
import { queryClient } from '@/lib/queryClient';
import '@/styles/globals.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider>
        <App />
      </RouterProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
