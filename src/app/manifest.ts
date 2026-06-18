import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'tzeedek-note — Secure Vault',
    short_name: 'tzeedek-note',
    description: 'Zero-knowledge vault for notes, passwords, and AI prompts.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#050505',
    theme_color: '#050505',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
