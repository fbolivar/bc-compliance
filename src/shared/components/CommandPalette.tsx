'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, ArrowRight, LayoutDashboard, Server, ShieldAlert, Bug, Shield,
  CheckSquare, AlertTriangle, FileWarning, Building2, FileText, ClipboardCheck,
  Zap, Plug, Settings, Users, KeyRound, ScrollText, Target, BarChart3, Bell,
} from 'lucide-react';

interface Command {
  id: string;
  label: string;
  href: string;
  group: string;
  keywords?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const COMMANDS: Command[] = [
  // Principal
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', group: 'Principal', icon: LayoutDashboard, keywords: 'tablero inicio principal' },
  { id: 'presentation', label: 'Modo presentación', href: '/dashboard/presentation', group: 'Principal', icon: LayoutDashboard, keywords: 'fullscreen pantalla' },

  // GRC
  { id: 'assets', label: 'Activos', href: '/assets', group: 'GRC', icon: Server, keywords: 'activos cmdb procesos' },
  { id: 'risks', label: 'Riesgos', href: '/risks', group: 'GRC', icon: ShieldAlert, keywords: 'riesgos magerit' },
  { id: 'risks-matrix', label: 'Matriz de Riesgos', href: '/risks/matrix', group: 'GRC', icon: ShieldAlert, keywords: 'matriz heatmap calor' },
  { id: 'risks-treatment', label: 'Planes de Tratamiento', href: '/risks/treatment-plans', group: 'GRC', icon: ShieldAlert },
  { id: 'threats', label: 'Amenazas', href: '/threats', group: 'GRC', icon: Target },
  { id: 'vulns', label: 'Vulnerabilidades', href: '/vulnerabilities', group: 'GRC', icon: Bug, keywords: 'vulns cve' },
  { id: 'controls', label: 'Controles', href: '/controls', group: 'GRC', icon: Shield, keywords: 'iso27001' },
  { id: 'controls-mapping', label: 'Mapeo de Controles', href: '/controls/mapping', group: 'GRC', icon: Shield },

  // Compliance
  { id: 'compliance', label: 'Cumplimiento Multi-Framework', href: '/compliance', group: 'Cumplimiento', icon: CheckSquare },
  { id: 'gap-analysis', label: 'Análisis de Brechas', href: '/compliance/gap-analysis', group: 'Cumplimiento', icon: CheckSquare, keywords: 'gaps' },
  { id: 'soa', label: 'SOA', href: '/compliance/soa', group: 'Cumplimiento', icon: CheckSquare, keywords: 'declaración aplicabilidad' },
  { id: 'soa-approvals', label: 'Aprobaciones SOA', href: '/compliance/soa/approvals', group: 'Cumplimiento', icon: CheckSquare },
  { id: 'cross-fw', label: 'Cross-Framework', href: '/compliance/cross-framework', group: 'Cumplimiento', icon: CheckSquare },

  // SecOps
  { id: 'incidents', label: 'Incidentes', href: '/incidents', group: 'SecOps', icon: AlertTriangle },
  { id: 'ncs', label: 'No Conformidades', href: '/nonconformities', group: 'SecOps', icon: FileWarning, keywords: 'nc capa' },
  { id: 'audits', label: 'Auditorías', href: '/audits', group: 'SecOps', icon: ClipboardCheck, keywords: 'iso 19011' },
  { id: 'vendors', label: 'Proveedores', href: '/vendors', group: 'SecOps', icon: Building2, keywords: 'vendor third party' },

  // Documentos
  { id: 'docs', label: 'Documentos', href: '/documents', group: 'Documentos', icon: FileText, keywords: 'políticas procedimientos' },
  { id: 'evidence', label: 'Evidencias', href: '/documents/evidence', group: 'Documentos', icon: FileText },

  // Otros
  { id: 'reports', label: 'Informes', href: '/reports', group: 'Otros', icon: BarChart3, keywords: 'reportes pdf excel' },
  { id: 'notifications', label: 'Notificaciones', href: '/notifications', group: 'Otros', icon: Bell, keywords: 'alertas' },
  { id: 'automation', label: 'Automatización', href: '/automation', group: 'Otros', icon: Zap },
  { id: 'integrations', label: 'Integraciones', href: '/integrations', group: 'Otros', icon: Plug },

  // Settings
  { id: 'settings', label: 'Configuración', href: '/settings', group: 'Configuración', icon: Settings },
  { id: 'users', label: 'Usuarios', href: '/settings/users', group: 'Configuración', icon: Users },
  { id: 'roles', label: 'Roles', href: '/settings/roles', group: 'Configuración', icon: KeyRound },
  { id: 'audit-log', label: 'Log de Auditoría', href: '/settings/audit-log', group: 'Configuración', icon: ScrollText },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((c) =>
      c.label.toLowerCase().includes(q) ||
      c.group.toLowerCase().includes(q) ||
      (c.keywords ?? '').toLowerCase().includes(q),
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const c of filtered) {
      if (!map.has(c.group)) map.set(c.group, []);
      map.get(c.group)!.push(c);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const flatList = filtered;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((p) => !p);
      } else if (e.key === '/' && !open && document.activeElement?.tagName !== 'INPUT' &&
                 document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      } else if (open && e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight((h) => Math.min(h + 1, flatList.length - 1));
      } else if (open && e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
      } else if (open && e.key === 'Enter' && flatList[highlight]) {
        e.preventDefault();
        router.push(flatList[highlight].href);
        setOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, flatList, highlight, router]);

  useEffect(() => {
    if (open) {
      setHighlight(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [open]);

  useEffect(() => setHighlight(0), [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/50 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar página, módulo, acción..."
            className="flex-1 py-3 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-100 border border-slate-200">
            ESC
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto py-2">
          {grouped.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              Ningún resultado para &ldquo;{query}&rdquo;
            </p>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group} className="mb-2">
                <p className="px-4 py-1 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  {group}
                </p>
                {items.map((c) => {
                  const idx = flatList.indexOf(c);
                  const isHigh = idx === highlight;
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onMouseEnter={() => setHighlight(idx)}
                      onClick={() => {
                        router.push(c.href);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${
                        isHigh ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isHigh ? 'text-sky-600' : 'text-slate-400'}`} />
                      <span className="flex-1">{c.label}</span>
                      {isHigh && <ArrowRight className="w-3.5 h-3.5 text-sky-500" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded">↑↓</kbd> navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded">↵</kbd> ir
            </span>
          </div>
          <span className="text-slate-400">{flatList.length} resultados</span>
        </div>
      </div>
    </div>
  );
}
