import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ServiceWorkerRegistrar } from '@/shared/components/ServiceWorkerRegistrar'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0ea5e9',
}

export const metadata: Metadata = {
  title: 'BC Trust - GRC & SecOps Platform',
  description: 'Plataforma unificada de ciberseguridad tecnica y cumplimiento normativo',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BC Trust',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: '/Logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  )
}
