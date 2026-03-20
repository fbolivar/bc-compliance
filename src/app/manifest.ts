import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BC Trust - GRC & SecOps Platform',
    short_name: 'BC Trust',
    description: 'Plataforma unificada de ciberseguridad tecnica y cumplimiento normativo',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#0ea5e9',
    orientation: 'any',
    categories: ['business', 'security', 'productivity'],
    icons: [
      {
        src: '/Logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/Logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
