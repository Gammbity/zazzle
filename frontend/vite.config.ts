import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const usePolling =
  process.env.VITE_USE_POLLING === 'true' ||
  process.env.CHOKIDAR_USEPOLLING === 'true';
const pollInterval = Number(
  process.env.VITE_POLL_INTERVAL ?? process.env.CHOKIDAR_INTERVAL ?? 300
);

function resolveManualChunk(id: string): string | undefined {
  const normalizedId = id.split(path.sep).join('/');

  if (normalizedId.includes('/node_modules/')) {
    if (normalizedId.includes('/@react-three/drei/')) {
      return 'react-three-drei-vendor';
    }

    if (normalizedId.includes('/@react-three/fiber/')) {
      return 'react-three-fiber-vendor';
    }

    if (
      normalizedId.includes('/three-stdlib/') ||
      normalizedId.includes('/maath/') ||
      normalizedId.includes('/meshline/') ||
      normalizedId.includes('/stats-gl/') ||
      normalizedId.includes('/troika-') ||
      normalizedId.includes('/suspend-react/') ||
      normalizedId.includes('/camera-controls/')
    ) {
      return 'react-three-support-vendor';
    }

    if (normalizedId.includes('/three/')) {
      return 'three-core-vendor';
    }

    if (normalizedId.includes('/fabric/')) {
      return 'fabric-vendor';
    }

    if (
      normalizedId.includes('/react-konva/') ||
      normalizedId.includes('/konva/')
    ) {
      return 'konva-vendor';
    }

    if (normalizedId.includes('/lucide-react/')) {
      return 'icons-vendor';
    }

    if (
      normalizedId.includes('/react/') ||
      normalizedId.includes('/react-dom/')
    ) {
      return 'react-vendor';
    }
  }

  if (normalizedId.includes('/src/components/editor/')) {
    return 'editor-tools';
  }

  if (
    normalizedId.includes('/src/components/customizer/MugViewer.tsx') ||
    normalizedId.includes('/src/components/customizer/PrintEditor.tsx') ||
    normalizedId.includes('/src/components/customizer/Sidebar.tsx')
  ) {
    return 'mug-customizer';
  }

  if (
    normalizedId.includes('/src/components/customizer/TshirtViewer.tsx') ||
    normalizedId.includes('/src/components/customizer/TshirtPrintEditor.tsx') ||
    normalizedId.includes('/src/components/customizer/TshirtSidebar.tsx')
  ) {
    return 'tshirt-customizer';
  }

  if (
    normalizedId.includes('/src/components/customizer/SingleSurface') ||
    normalizedId.includes(
      '/src/components/customizer/single-surface-presets.ts'
    )
  ) {
    return 'single-surface-customizer';
  }

  return undefined;
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: resolveManualChunk,
      },
    },
  },
  server: {
    allowedHosts: ['frontend', 'localhost', '127.0.0.1'],
    port: 3000,
    watch: usePolling
      ? {
          usePolling: true,
          interval: Number.isFinite(pollInterval) ? pollInterval : 300,
        }
      : undefined,
  },
  preview: {
    port: 3000,
  },
});
