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
import { useState, useRef, useEffect } from 'react';
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

const baseSettingsNav: NavItem[] = [
  { label: 'Configuración', href: '/settings', icon: Settings },
  { label: 'Usuarios', href: '/settings/users', icon: Users },
  { label: 'Roles', href: '/settings/roles', icon: KeyRound },
  { label: 'Log de Auditoría', href: '/settings/audit-log', icon: ScrollText },
];

const clientsNavItem: NavItem = { label: 'Clientes', href: '/settings/clients', icon: Building2 };

export function PlatformSidebar({ isPlatformOwner = false, userEmail = '' }: { isPlatformOwner?: boolean; userEmail?: string }) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    if (showProfile) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfile]);

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
                w-full flex items-center gap-3 px-3 py-[9px] rounded-md text-[13px] font-medium transition-all duration-150
                ${active
                  ? 'border-l-2 border-cyan-400 bg-cyan-500/8 text-cyan-400 pl-[10px]'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] border-l-2 border-transparent'}
              `}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
              <ul className="mt-0.5 ml-8 space-y-0.5 pb-1">
                {item.children.map(child => (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      className={`
                        block px-3 py-1.5 rounded-md text-[12px] transition-colors duration-150
                        ${pathname === child.href
                          ? 'text-cyan-400 font-medium bg-cyan-500/5'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/20'}
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
              flex items-center gap-3 px-3 py-[9px] rounded-md text-[13px] font-medium transition-all duration-150
              ${active
                ? 'border-l-2 border-cyan-400 bg-cyan-500/8 text-cyan-400 pl-[10px]'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] border-l-2 border-transparent'}
            `}
          >
            <Icon className="h-[18px] w-[18px] flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        )}
      </li>
    );
  };

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#0c1222] shadow-[1px_0_0_0_rgba(30,41,59,0.8)]">
      {/* Logo */}
      <div className="flex items-center h-14 px-6 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 to-slate-900/80">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <span className="text-[14px] font-bold text-white tracking-tight">BC</span>
            <span className="text-[14px] font-light text-cyan-400 tracking-tight"> Compliance</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700/50">
        <ul className="space-y-0.5">
          {navigation.map(renderNavItem)}
        </ul>

        {/* Divider */}
        <div className="my-4" />

        {/* Settings Section */}
        <p className="px-3 mt-6 mb-2 text-[9px] font-semibold text-slate-600/80 uppercase tracking-[0.15em]">
          Administración
        </p>
        <ul className="space-y-0.5">
          {isPlatformOwner && renderNavItem(clientsNavItem)}
          {baseSettingsNav.map(renderNavItem)}
        </ul>
      </nav>

      {/* Footer - User profile */}
      <div className="px-3 py-3 border-t border-slate-800/80 relative" ref={profileRef}>
        {/* Profile popover */}
        {showProfile && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#141c2e] border border-slate-700/80 rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-[fadeIn_0.15s_ease-out]">
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[14px] font-semibold text-cyan-400 uppercase">
                    {userEmail?.charAt(0) ?? '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white truncate">{userEmail || 'Usuario'}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Cuenta activa</p>
                </div>
              </div>
            </div>
            <div className="p-1.5">
              <Link
                href="/settings"
                onClick={() => setShowProfile(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Configuracion</span>
              </Link>
              <button
                type="button"
                onClick={() => signout()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesion</span>
              </button>
            </div>
          </div>
        )}

        {/* Avatar button */}
        <button
          type="button"
          onClick={() => setShowProfile(!showProfile)}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800/30 transition-colors"
        >
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-[12px] font-semibold text-cyan-400 uppercase">
              {userEmail?.charAt(0) ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[12px] text-slate-500 truncate">{userEmail || 'Usuario'}</p>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </aside>
  );
}
