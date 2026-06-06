import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          strategies: 'injectManifest',
          srcDir: '.',
          filename: 'sw.ts',
          manifest: {
            name: 'Super Word Buddy',
            short_name: 'Word Buddy',
            description: 'Akademik İngilizce kelime öğrenme uygulaması',
            theme_color: '#4F46E5',
            background_color: '#fdfbf7',
            display: 'standalone',
            orientation: 'portrait',
            start_url: '/',
            scope: '/',
            icons: [
              { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
              { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
              { src: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
            ]
          },
          injectManifest: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
