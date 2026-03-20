import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BC Trust - GRC & SecOps Platform',
    short_name: 'BC Trust',
    description: 'Plataforma unificada de ciberseguridad tecnica y cumplimiento normativo',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#06b6d4',
    orientation: 'any',
    categories: ['business', 'security', 'productivity'],
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
