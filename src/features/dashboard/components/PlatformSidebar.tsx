'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Server,
  ShieldAlert,
  Bug,
  Shield,
  CheckSquare,
  AlertTriangle,
  FileWarning,
  Building2,
  FileText,
  ClipboardCheck,
  Zap,
  Plug,
  Settings,
  Users,
  KeyRound,
  ScrollText,
  Target,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { signout } from '@/actions/auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}

const navigation: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Activos (CMDB)', href: '/assets', icon: Server,
  },
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
      { label: 'Catálogo', href: '/controls' },
      { label: 'Mapeo Cross-Framework', href: '/controls/mapping' },
    ]
  },
  {
    label: 'Cumplimiento', href: '/compliance', icon: CheckSquare,
    children: [
      { label: 'Multi-Framework', href: '/compliance' },
      { label: 'Análisis de Brechas', href: '/compliance/gap-analysis' },
      { label: 'SOA', href: '/compliance/soa' },
    ]
  },
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
  {
    label: 'Auditorías', href: '/audits', icon: ClipboardCheck,
    children: [
      { label: 'Programas', href: '/audits' },
      { label: 'Informes', href: '/audits/reports' },
    ]
  },
  { label: 'Automatización', href: '/automation', icon: Zap },
  { label: 'Integraciones', href: '/integrations', icon: Plug },
];

const settingsNav: NavItem[] = [
  { label: 'Configuración', href: '/settings', icon: Settings },
  { label: 'Usuarios', href: '/settings/users', icon: Users },
  { label: 'Roles', href: '/settings/roles', icon: KeyRound },
  { label: 'Log de Auditoría', href: '/settings/audit-log', icon: ScrollText },
];

export function PlatformSidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(i => i !== label)
        : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);
    const expanded = expandedItems.includes(item.label) || (item.children && pathname.startsWith(item.href));
    const Icon = item.icon;

    return (
      <li key={item.href}>
        {item.children ? (
          <>
            <button
              onClick={() => toggleExpand(item.label)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${active
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}
              `}
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
                      className={`
                        block px-3 py-1.5 rounded-md text-sm transition-colors
                        ${pathname === child.href
                          ? 'text-cyan-400 font-medium'
                          : 'text-slate-500 hover:text-slate-300'}
                      `}
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
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${active
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}
            `}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        )}
      </li>
    );
  };

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-slate-900 border-r border-slate-800">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-cyan-500 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white">BC</span>
            <span className="text-lg font-light text-cyan-400"> Compliance</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map(renderNavItem)}
        </ul>

        {/* Divider */}
        <div className="my-4 border-t border-slate-800" />

        {/* Settings Section */}
        <p className="px-3 mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Administración
        </p>
        <ul className="space-y-1">
          {settingsNav.map(renderNavItem)}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-300 truncate">Mi Organización</p>
            <p className="text-xs text-slate-500">Enterprise</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signout()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-rose-400 hover:bg-slate-800/50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesion</span>
        </button>
      </div>
    </aside>
  );
}
