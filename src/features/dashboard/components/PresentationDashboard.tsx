'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, RefreshCw, ChevronLeft, ChevronRight, Pause, Play, Maximize2 } from 'lucide-react';
import type { MspiPosture } from '@/features/dashboard/services/executiveDashboardService';
import type { FrameworkRow } from '@/features/compliance/services/complianceService';
import type { ProcessHealth, OperationalMetrics } from '@/features/dashboard/services/executiveDashboardService';

interface Props {
  orgName: string;
  posture: MspiPosture;
  frameworks: FrameworkRow[];
  processes: ProcessHealth[];
  metrics: OperationalMetrics;
  mspiHistory: number[];
}

const SLIDES = ['posture', 'phva', 'frameworks', 'operations', 'processes'] as const;
type Slide = typeof SLIDES[number];

const REFRESH_INTERVAL = 60_000; // 60s
const SLIDE_INTERVAL = 12_000; // 12s

export function PresentationDashboard({
  orgName, posture, frameworks, processes, metrics,
}: Props) {
  const router = useRouter();
  const [slide, setSlide] = useState<Slide>('posture');
  const [autoPlay, setAutoPlay] = useState(true);
  const [now, setNow] = useState(new Date());
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refreshTimer.current = setInterval(() => router.refresh(), REFRESH_INTERVAL);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [router]);

  useEffect(() => {
    if (!autoPlay) {
      if (slideTimer.current) clearInterval(slideTimer.current);
      return;
    }
    slideTimer.current = setInterval(() => {
      setSlide((s) => SLIDES[(SLIDES.indexOf(s) + 1) % SLIDES.length]);
    }, SLIDE_INTERVAL);
    return () => { if (slideTimer.current) clearInterval(slideTimer.current); };
  }, [autoPlay]);

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exit();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === ' ') { e.preventDefault(); setAutoPlay((p) => !p); }
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const next = () => setSlide((s) => SLIDES[(SLIDES.indexOf(s) + 1) % SLIDES.length]);
  const prev = () => setSlide((s) => SLIDES[(SLIDES.indexOf(s) - 1 + SLIDES.length) % SLIDES.length]);
  const exit = () => router.push('/dashboard');

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden"
    >
      {/* Top bar */}
      <header className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-8 py-4 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img src="/Logo.png" alt="BC Trust" className="h-8 w-auto rounded" />
          <div>
            <p className="text-sm font-semibold">{orgName}</p>
            <p className="text-xs text-slate-400">Tablero ejecutivo · Modo presentación</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-mono">{now.toLocaleTimeString('es-CO')}</p>
            <p className="text-[10px] text-slate-400">{now.toLocaleDateString('es-CO', { dateStyle: 'medium' })}</p>
          </div>
          <button
            type="button"
            onClick={() => setAutoPlay((p) => !p)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            aria-label={autoPlay ? 'Pausar' : 'Reproducir'}
          >
            {autoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Refrescar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Pantalla completa"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={exit}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Salir (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Slide navigation arrows */}
      <button
        type="button"
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Anterior"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Siguiente"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide content */}
      <main className="absolute inset-0 pt-24 pb-20 px-12 flex items-center justify-center">
        {slide === 'posture' && <PostureSlide posture={posture} />}
        {slide === 'phva' && <PhvaSlide posture={posture} />}
        {slide === 'frameworks' && <FrameworksSlide frameworks={frameworks} />}
        {slide === 'operations' && <OperationsSlide metrics={metrics} />}
        {slide === 'processes' && <ProcessesSlide processes={processes} />}
      </main>

      {/* Slide indicator */}
      <footer className="absolute bottom-0 inset-x-0 z-10 flex items-center justify-between px-8 py-4 bg-black/30 backdrop-blur-sm">
        <p className="text-xs text-slate-400">
          ESC salir · ← → navegar · Espacio pausa · F pantalla completa
        </p>
        <div className="flex items-center gap-1.5">
          {SLIDES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSlide(s)}
              className={`h-1.5 rounded-full transition-all ${
                s === slide ? 'w-8 bg-sky-400' : 'w-1.5 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Ir a slide ${s}`}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400">
          {SLIDES.indexOf(slide) + 1} / {SLIDES.length}
        </p>
      </footer>
    </div>
  );
}

// ─── SLIDES ─────────────────────────────────────────────────────────────────

function PostureSlide({ posture }: { posture: MspiPosture }) {
  const color = posture.score >= 80 ? '#10b981' :
    posture.score >= 60 ? '#06b6d4' :
    posture.score >= 40 ? '#f59e0b' :
    posture.score >= 20 ? '#fb923c' : '#f43f5e';

  return (
    <div className="text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-4">Postura de Seguridad MSPI</p>
      <div className="relative inline-block">
        <p className="text-[200px] font-bold tabular-nums leading-none" style={{ color }}>
          {posture.score}
        </p>
        <span className="absolute -bottom-4 -right-12 text-3xl text-slate-400">/ 100</span>
      </div>
      <p className="text-4xl font-semibold mt-12" style={{ color }}>
        Nivel {posture.levelLabel}
      </p>
      <p className="text-base text-slate-400 mt-4 max-w-2xl mx-auto">
        Modelo de Seguridad y Privacidad de la Información · MinTIC · Ciclo PHVA
      </p>
    </div>
  );
}

function PhvaSlide({ posture }: { posture: MspiPosture }) {
  const phases = [
    { label: 'Planear', value: posture.phva.planear, color: '#06b6d4' },
    { label: 'Hacer', value: posture.phva.hacer, color: '#10b981' },
    { label: 'Verificar', value: posture.phva.verificar, color: '#f59e0b' },
    { label: 'Actuar', value: posture.phva.actuar, color: '#6366f1' },
  ];
  return (
    <div className="w-full max-w-6xl">
      <p className="text-center text-sm uppercase tracking-[0.3em] text-slate-400 mb-12">
        Ciclo PHVA · Madurez por Fase
      </p>
      <div className="grid grid-cols-4 gap-8">
        {phases.map((p) => (
          <div key={p.label} className="text-center">
            <p className="text-sm uppercase text-slate-400 tracking-wider mb-3">{p.label}</p>
            <p className="text-7xl font-bold tabular-nums" style={{ color: p.color }}>
              {p.value}<span className="text-3xl text-slate-400">%</span>
            </p>
            <div className="mt-6 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full transition-all duration-1000" style={{ width: `${p.value}%`, backgroundColor: p.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FrameworksSlide({ frameworks }: { frameworks: FrameworkRow[] }) {
  const sorted = [...frameworks].sort((a, b) => a.compliance_percentage - b.compliance_percentage).slice(0, 8);
  return (
    <div className="w-full max-w-4xl">
      <p className="text-center text-sm uppercase tracking-[0.3em] text-slate-400 mb-10">
        Cumplimiento Multi-Framework
      </p>
      <div className="space-y-4">
        {sorted.map((fw) => {
          const c = fw.compliance_percentage >= 80 ? '#10b981' :
            fw.compliance_percentage >= 60 ? '#06b6d4' :
            fw.compliance_percentage >= 40 ? '#f59e0b' : '#f43f5e';
          return (
            <div key={fw.id} className="flex items-center gap-6">
              <p className="text-base font-semibold text-white w-72 truncate">{fw.name}</p>
              <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full transition-all duration-1000" style={{ width: `${fw.compliance_percentage}%`, backgroundColor: c }} />
              </div>
              <p className="text-2xl font-bold tabular-nums w-20 text-right" style={{ color: c }}>
                {fw.compliance_percentage}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OperationsSlide({ metrics }: { metrics: OperationalMetrics }) {
  return (
    <div className="w-full max-w-5xl">
      <p className="text-center text-sm uppercase tracking-[0.3em] text-slate-400 mb-12">Operación SecOps en Vivo</p>
      <div className="grid grid-cols-3 gap-8">
        <MetricCard label="Incidentes activos" value={metrics.incidents.totalActive} color={metrics.incidents.totalActive > 0 ? '#fb923c' : '#10b981'} />
        <MetricCard label="Vulns abiertas" value={metrics.vulnerabilities.totalOpen} color={metrics.vulnerabilities.totalOpen > 0 ? '#f43f5e' : '#10b981'} sub={`${metrics.vulnerabilities.bySeverity.critical ?? 0} críticas`} />
        <MetricCard label="NCs abiertas" value={metrics.nonconformities.totalOpen} color={metrics.nonconformities.totalOpen > 0 ? '#f59e0b' : '#10b981'} sub={metrics.nonconformities.overdue > 0 ? `${metrics.nonconformities.overdue} vencidas` : 'al día'} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, color, sub }: { label: string; value: number; color: string; sub?: string }) {
  return (
    <div className="text-center bg-white/5 rounded-2xl p-8 border border-white/10">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-3">{label}</p>
      <p className="text-7xl font-bold tabular-nums" style={{ color }}>{value}</p>
      {sub && <p className="text-sm text-slate-400 mt-3">{sub}</p>}
    </div>
  );
}

function ProcessesSlide({ processes }: { processes: ProcessHealth[] }) {
  // Solo procesos PE/PM/PA/PV (filtra parques y otros assets)
  const procs = processes.filter((p) => /^P[EMAV]-/.test(p.code));
  const avg = procs.length > 0 ? Math.round(procs.reduce((s, p) => s + p.health, 0) / procs.length) : 0;

  return (
    <div className="w-full max-w-6xl">
      <p className="text-center text-sm uppercase tracking-[0.3em] text-slate-400 mb-3">
        Salud de Procesos Institucionales
      </p>
      <p className="text-center text-base text-slate-300 mb-10">
        {procs.length} procesos · Salud promedio <span className="font-bold text-sky-400">{avg}%</span>
      </p>
      <div className="grid grid-cols-5 gap-3">
        {procs.map((p) => {
          const c = p.health >= 80 ? '#10b981' :
            p.health >= 60 ? '#06b6d4' :
            p.health >= 40 ? '#f59e0b' : '#f43f5e';
          return (
            <div key={p.asset_id} className="bg-white/5 rounded-lg p-3 border border-white/10">
              <p className="font-mono text-[10px] text-slate-400">{p.code}</p>
              <p className="text-xs font-semibold leading-tight line-clamp-2 my-1">{p.name}</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: c }}>{p.health}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
