'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Server, ShieldAlert, Bug, Shield, CheckSquare,
  AlertTriangle, FileWarning, Building2, FileText, ClipboardCheck,
  Zap, Plug, Settings, Users, KeyRound, ScrollText, Target,
  ChevronDown, LogOut, Menu, X, BarChart3, Bell, BookOpen, CalendarClock, HeartPulse, MapPin,
} from 'lucide-react';
import { signout } from '@/actions/auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}

const navigation: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Activos (CMDB)', href: '/assets', icon: Server },
  {
    label: 'Riesgos', href: '/risks', icon: ShieldAlert,
    children: [
      { label: 'Registro de Riesgos', href: '/risks' },
      { label: 'Matriz de Riesgos', href: '/risks/matrix' },
      { label: 'Planes de Tratamiento', href: '/risks/treatment-plans' },
    ]
  },
  { label: 'Amenazas', href: '/threats', icon: Target },
  { label: 'Vulnerabilidades', href: '/vulnerabilities', icon: Bug },
  {
    label: 'Controles', href: '/controls', icon: Shield,
    children: [
      { label: 'Catalogo', href: '/controls' },
      { label: 'Mapeo Cross-Framework', href: '/controls/mapping' },
    ]
  },
  {
    label: 'Cumplimiento', href: '/compliance', icon: CheckSquare,
    children: [
      { label: 'Multi-Framework', href: '/compliance' },
      { label: 'Analisis de Brechas', href: '/compliance/gap-analysis' },
      { label: 'SOA', href: '/compliance/soa' },
      { label: 'Aprobaciones SOA', href: '/compliance/soa/approvals' },
      { label: 'Cross-Framework', href: '/compliance/cross-framework' },
    ]
  },
  { label: 'Asistente ISO 27001', href: '/iso-wizard', icon: MapPin },
  { label: 'Incidentes', href: '/incidents', icon: AlertTriangle },
  { label: 'No Conformidades', href: '/nonconformities', icon: FileWarning },
  { label: 'Proveedores', href: '/vendors', icon: Building2 },
  {
    label: 'Documentos', href: '/documents', icon: FileText,
    children: [
      { label: 'Biblioteca', href: '/documents' },
      { label: 'Evidencias', href: '/documents/evidence' },
    ]
  },
  { label: 'Politicas', href: '/policies', icon: BookOpen },
  { label: 'Calendario Regulatorio', href: '/regulatory-calendar', icon: CalendarClock },
  {
    label: 'Auditorias', href: '/audits', icon: ClipboardCheck,
    children: [
      { label: 'Programas', href: '/audits' },
      { label: 'Informes', href: '/audits/reports' },
    ]
  },
  {
    label: 'Continuidad',
    href: '/business-continuity',
    icon: HeartPulse,
    children: [
      { label: 'Planes BCP/DRP', href: '/business-continuity' },
      { label: 'Analisis de Impacto', href: '/business-continuity?tab=bia' },
      { label: 'Pruebas y Ejercicios', href: '/business-continuity?tab=pruebas' },
    ],
  },
  { label: 'Informes', href: '/reports', icon: BarChart3 },
  { label: 'Notificaciones', href: '/notifications', icon: Bell },
  { label: 'Automatizacion', href: '/automation', icon: Zap },
  { label: 'Integraciones', href: '/integrations', icon: Plug },
];

const baseSettingsNav: NavItem[] = [
  { label: 'Configuracion', href: '/settings', icon: Settings },
  { label: 'Usuarios', href: '/settings/users', icon: Users },
  { label: 'Roles', href: '/settings/roles', icon: KeyRound },
  { label: 'Log de Auditoria', href: '/settings/audit-log', icon: ScrollText },
];

const clientsNavItem: NavItem = { label: 'Clientes', href: '/settings/clients', icon: Building2 };

export function MobileSidebar({ isPlatformOwner = false }: { isPlatformOwner?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const touchStartX = useRef(0);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 80) setIsOpen(false); // swipe left to close
  };

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);
    const expanded = expandedItems.includes(item.label) || (item.children !== undefined && pathname.startsWith(item.href));
    const Icon = item.icon;

    return (
      <li key={item.href}>
        {item.children ? (
          <>
            <button
              onClick={() => toggleExpand(item.label)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-sky-50 text-sky-600' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
              <ul className="mt-1 ml-8 space-y-1">
                {item.children.map(child => (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        pathname === child.href ? 'text-sky-600 font-medium' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <Link
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active ? 'bg-sky-50 text-sky-600' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        )}
      </li>
    );
  };

  return (
    <>
      {/* Hamburger button - only visible on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        ref={sidebarRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
          <img src="/Logo.png" alt="BC Trust" className="h-12 w-auto rounded-lg bg-gradient-to-br from-slate-50 to-slate-100" />
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Cerrar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className="px-3 py-4 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 64px - 120px)' }}
          aria-label="Navegacion principal"
        >
          <ul className="space-y-1">
            {navigation.map(renderNavItem)}
          </ul>
          <div className="my-4 border-t border-slate-200" />
          <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Administracion
          </p>
          <ul className="space-y-1">
            {isPlatformOwner && renderNavItem(clientsNavItem)}
            {baseSettingsNav.map(renderNavItem)}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => signout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesion</span>
          </button>
        </div>
      </div>
    </>
  );
}
