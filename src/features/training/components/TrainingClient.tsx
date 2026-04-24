'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Plus, Trash2, Edit2, X, Check, AlertCircle,
  Users, Calendar, Clock, Award, ChevronRight, GraduationCap,
  Monitor, UserCheck, FileText, Zap,
} from 'lucide-react';
import type { TrainingCampaign, TrainingSession, TrainingEnrollment, CampaignType, SessionFormat, EnrollmentStatus } from '../types/training';
import {
  createCampaign, updateCampaign, deleteCampaign,
  createSession, updateSession, deleteSession,
  createEnrollment, updateEnrollment,
} from '../actions/trainingActions';

// ─── Label/color maps ──────────────────────────────────────────────────────────

const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  awareness: 'Concienciación',
  compliance: 'Cumplimiento',
  technical: 'Técnica',
  onboarding: 'Inducción',
  phishing_simulation: 'Simulación Phishing',
};

const CAMPAIGN_STATUS_COLOR: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-sky-100 text-sky-700',
  archived: 'bg-amber-100 text-amber-700',
};

const CAMPAIGN_STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', active: 'Activa', completed: 'Completada', archived: 'Archivada',
};

const FORMAT_ICON: Record<SessionFormat, React.ElementType> = {
  in_person: Users,
  online: Monitor,
  hybrid: Users,
  video: Monitor,
  document: FileText,
  phishing: Zap,
};

const FORMAT_LABEL: Record<SessionFormat, string> = {
  in_person: 'Presencial',
  online: 'Online',
  hybrid: 'Híbrido',
  video: 'Video',
  document: 'Documento',
  phishing: 'Phishing',
};

const ENROLLMENT_STATUS_COLOR: Record<EnrollmentStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-sky-100 text-sky-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700',
  excused: 'bg-slate-100 text-slate-600',
};

const ENROLLMENT_STATUS_LABEL: Record<EnrollmentStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  completed: 'Completado',
  failed: 'Reprobado',
  excused: 'Excusado',
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  campaigns: TrainingCampaign[];
  sessions: TrainingSession[];
  enrollments: TrainingEnrollment[];
  activeTab: string;
}

// ─── Campaign Form Modal ────────────────────────────────────────────────────────

function CampaignModal({
  campaign,
  onClose,
}: {
  campaign?: TrainingCampaign;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!formData.get('mandatory')) formData.set('mandatory', 'false');
    startTransition(async () => {
      const res = campaign
        ? await updateCampaign(campaign.id, formData)
        : await createCampaign(formData);
      if (res.error) { setError(res.error); return; }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">
            {campaign ? 'Editar Campaña' : 'Nueva Campaña'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Título *</label>
            <input name="title" required defaultValue={campaign?.title}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
            <textarea name="description" rows={2} defaultValue={campaign?.description ?? ''}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
              <select name="type" defaultValue={campaign?.type ?? 'awareness'}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                {Object.entries(CAMPAIGN_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Estado</label>
              <select name="status" defaultValue={campaign?.status ?? 'draft'}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                <option value="draft">Borrador</option>
                <option value="active">Activa</option>
                <option value="completed">Completada</option>
                <option value="archived">Archivada</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Audiencia objetivo</label>
            <input name="target_audience" defaultValue={campaign?.target_audience ?? ''}
              placeholder="Ej: Todo el personal, Área TI..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha límite</label>
              <input name="due_date" type="date" defaultValue={campaign?.due_date ?? ''}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cláusula ISO</label>
              <input name="iso_clause" defaultValue={campaign?.iso_clause ?? 'A.6.3'}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input name="mandatory" type="checkbox" defaultChecked={campaign?.mandatory} value="true"
              className="rounded border-slate-300 text-sky-600" />
            Capacitación obligatoria
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors">
              {isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Session Form Modal ─────────────────────────────────────────────────────────

function SessionModal({
  session,
  campaigns,
  onClose,
}: {
  session?: TrainingSession;
  campaigns: TrainingCampaign[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = session
        ? await updateSession(session.id, formData)
        : await createSession(formData);
      if (res.error) { setError(res.error); return; }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">
            {session ? 'Editar Sesión' : 'Nueva Sesión'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Campaña</label>
            <select name="campaign_id" defaultValue={session?.campaign_id ?? ''}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
              <option value="">Sin campaña</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Título *</label>
            <input name="title" required defaultValue={session?.title}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
            <textarea name="description" rows={2} defaultValue={session?.description ?? ''}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Formato</label>
              <select name="format" defaultValue={session?.format ?? 'online'}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                {Object.entries(FORMAT_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Duración (min)</label>
              <input name="duration_minutes" type="number" min="1" defaultValue={session?.duration_minutes ?? 60}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha y hora</label>
              <input name="scheduled_at" type="datetime-local"
                defaultValue={session?.scheduled_at ? session.scheduled_at.slice(0, 16) : ''}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nota aprobatoria (%)</label>
              <input name="passing_score" type="number" min="0" max="100" defaultValue={session?.passing_score ?? 70}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Instructor</label>
              <input name="trainer" defaultValue={session?.trainer ?? ''}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Lugar / URL</label>
              <input name="location" defaultValue={session?.location ?? ''}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors">
              {isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Enrollment Form Modal ──────────────────────────────────────────────────────

function EnrollmentModal({
  enrollment,
  sessions,
  onClose,
}: {
  enrollment?: TrainingEnrollment;
  sessions: TrainingSession[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = enrollment
        ? await updateEnrollment(enrollment.id, formData)
        : await createEnrollment(formData);
      if (res.error) { setError(res.error); return; }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">
            {enrollment ? 'Editar Participante' : 'Registrar Participante'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Sesión *</label>
            <select name="session_id" required defaultValue={enrollment?.session_id ?? ''}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
              <option value="">Seleccionar...</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
              <input name="user_name" required defaultValue={enrollment?.user_name}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
              <input name="user_email" type="email" required defaultValue={enrollment?.user_email}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Área / Departamento</label>
              <input name="department" defaultValue={enrollment?.department ?? ''}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Estado</label>
              <select name="status" defaultValue={enrollment?.status ?? 'pending'}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completado</option>
                <option value="failed">Reprobado</option>
                <option value="excused">Excusado</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Calificación (%)</label>
              <input name="score" type="number" min="0" max="100" defaultValue={enrollment?.score ?? ''}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha completado</label>
              <input name="completed_at" type="date"
                defaultValue={enrollment?.completed_at ? enrollment.completed_at.slice(0, 10) : ''}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Observaciones</label>
            <textarea name="notes" rows={2} defaultValue={enrollment?.notes ?? ''}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors">
              {isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete confirm ─────────────────────────────────────────────────────────────

function DeleteConfirm({
  label,
  onConfirm,
  onCancel,
  isPending,
}: {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-2">¿Eliminar?</h2>
        <p className="text-sm text-slate-500 mb-6">Se eliminará <span className="font-medium text-slate-700">"{label}"</span> y sus registros relacionados. Esta acción no se puede deshacer.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={isPending}
            className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50 transition-colors">
            {isPending ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Campaigns Tab ──────────────────────────────────────────────────────────────

function CampaignsTab({ campaigns }: { campaigns: TrainingCampaign[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<TrainingCampaign | undefined>();
  const [deleting, setDeleting] = useState<TrainingCampaign | undefined>();

  function handleDelete(campaign: TrainingCampaign) {
    startTransition(async () => {
      const { deleteCampaign: del } = await import('../actions/trainingActions');
      await del(campaign.id);
      router.refresh();
      setDeleting(undefined);
    });
  }

  return (
    <>
      {(showCreate || editing) && (
        <CampaignModal
          campaign={editing}
          onClose={() => { setShowCreate(false); setEditing(undefined); }}
        />
      )}
      {deleting && (
        <DeleteConfirm
          label={deleting.title}
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(undefined)}
          isPending={isPending}
        />
      )}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{campaigns.length} campañas registradas</p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Campaña
        </button>
      </div>
      {campaigns.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Sin campañas de formación</p>
          <p className="text-xs mt-1">Crea tu primera campaña de concienciación</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {campaigns.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${CAMPAIGN_STATUS_COLOR[c.status]}`}>
                      {CAMPAIGN_STATUS_LABEL[c.status]}
                    </span>
                    {c.mandatory && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 text-rose-700">
                        Obligatoria
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 truncate">{c.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{CAMPAIGN_TYPE_LABELS[c.type]}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setEditing(c)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleting(c)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {c.description && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{c.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-slate-400">
                {c.target_audience && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {c.target_audience}
                  </span>
                )}
                {c.due_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(c.due_date).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                  </span>
                )}
                {c.iso_clause && (
                  <span className="font-mono text-sky-600">{c.iso_clause}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Sessions Tab ───────────────────────────────────────────────────────────────

function SessionsTab({ sessions, campaigns }: { sessions: TrainingSession[]; campaigns: TrainingCampaign[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<TrainingSession | undefined>();
  const [deleting, setDeleting] = useState<TrainingSession | undefined>();

  function handleDelete(session: TrainingSession) {
    startTransition(async () => {
      const { deleteSession: del } = await import('../actions/trainingActions');
      await del(session.id);
      router.refresh();
      setDeleting(undefined);
    });
  }

  return (
    <>
      {(showCreate || editing) && (
        <SessionModal
          session={editing}
          campaigns={campaigns}
          onClose={() => { setShowCreate(false); setEditing(undefined); }}
        />
      )}
      {deleting && (
        <DeleteConfirm
          label={deleting.title}
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(undefined)}
          isPending={isPending}
        />
      )}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{sessions.length} sesiones registradas</p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Sesión
        </button>
      </div>
      {sessions.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Sin sesiones de formación</p>
          <p className="text-xs mt-1">Agrega sesiones a tus campañas</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sesión</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Formato</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Duración</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map(s => {
                const Icon = FORMAT_ICON[s.format];
                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 text-sm">{s.title}</p>
                      {s.campaign && (
                        <p className="text-xs text-slate-400 mt-0.5">{s.campaign.title}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                        {FORMAT_LABEL[s.format]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                      {s.scheduled_at
                        ? new Date(s.scheduled_at).toLocaleDateString('es-CO', { dateStyle: 'medium' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                      {s.duration_minutes ? (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration_minutes} min</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setEditing(s)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleting(s)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ─── Enrollments Tab ────────────────────────────────────────────────────────────

function EnrollmentsTab({ enrollments, sessions }: { enrollments: TrainingEnrollment[]; sessions: TrainingSession[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<TrainingEnrollment | undefined>();

  return (
    <>
      {(showCreate || editing) && (
        <EnrollmentModal
          enrollment={editing}
          sessions={sessions}
          onClose={() => { setShowCreate(false); setEditing(undefined); }}
        />
      )}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{enrollments.length} participantes registrados</p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registrar Participante
        </button>
      </div>
      {enrollments.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Sin participantes registrados</p>
          <p className="text-xs mt-1">Registra el personal que tomó las capacitaciones</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Participante</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Sesión</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Calificación</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Completado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrollments.map(e => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 text-sm">{e.user_name}</p>
                    <p className="text-xs text-slate-400">{e.user_email}</p>
                    {e.department && <p className="text-xs text-slate-400">{e.department}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                    {e.session?.title ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${ENROLLMENT_STATUS_COLOR[e.status]}`}>
                      {ENROLLMENT_STATUS_LABEL[e.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                    {e.score != null ? (
                      <span className={`flex items-center gap-1 font-medium ${e.score >= 70 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {e.status === 'completed' ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {e.score}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                    {e.completed_at
                      ? new Date(e.completed_at).toLocaleDateString('es-CO', { dateStyle: 'short' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setEditing(e)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ─── Metrics Tab ────────────────────────────────────────────────────────────────

function MetricsTab({ campaigns, enrollments }: { campaigns: TrainingCampaign[]; enrollments: TrainingEnrollment[] }) {
  const byStatus = enrollments.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});

  const byCampaign = campaigns.map(c => {
    const total = enrollments.filter(e => e.session_id).length;
    return { ...c, total };
  });

  const completionRate = enrollments.length > 0
    ? Math.round((byStatus['completed'] ?? 0) / enrollments.length * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Completion donut summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(ENROLLMENT_STATUS_LABEL).map(([status, label]) => (
          <div key={status} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-2xl font-semibold text-slate-800">{byStatus[status] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Completion rate progress */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Tasa de Completitud Global</h3>
            <p className="text-xs text-slate-500 mt-0.5">{enrollments.length} participantes en total</p>
          </div>
          <span className="text-2xl font-bold text-sky-600">{completionRate}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-700"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Campaigns summary */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Estado de Campañas</h3>
        </div>
        {campaigns.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">Sin campañas</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {campaigns.map(c => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">{c.title}</p>
                  <p className="text-xs text-slate-400">{CAMPAIGN_TYPE_LABELS[c.type]}</p>
                </div>
                <div className="flex items-center gap-3">
                  {c.due_date && (
                    <span className="text-xs text-slate-400">
                      Vence: {new Date(c.due_date).toLocaleDateString('es-CO', { dateStyle: 'short' })}
                    </span>
                  )}
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${CAMPAIGN_STATUS_COLOR[c.status]}`}>
                    {CAMPAIGN_STATUS_LABEL[c.status]}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Client Component ──────────────────────────────────────────────────────

const TABS = [
  { key: 'campanas', label: 'Campañas', icon: GraduationCap },
  { key: 'sesiones', label: 'Sesiones', icon: BookOpen },
  { key: 'participantes', label: 'Participantes', icon: UserCheck },
  { key: 'metricas', label: 'Métricas', icon: Award },
];

export function TrainingClient({ campaigns, sessions, enrollments, activeTab }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState(activeTab);

  function changeTab(key: string) {
    setTab(key);
    router.push(`/training?tab=${key}`, { scroll: false });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-100 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => changeTab(t.key)}
              className={`
                flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${tab === t.key
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
              `}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>
      {/* Content */}
      <div className="p-6">
        {tab === 'campanas' && <CampaignsTab campaigns={campaigns} />}
        {tab === 'sesiones' && <SessionsTab sessions={sessions} campaigns={campaigns} />}
        {tab === 'participantes' && <EnrollmentsTab enrollments={enrollments} sessions={sessions} />}
        {tab === 'metricas' && <MetricsTab campaigns={campaigns} enrollments={enrollments} />}
      </div>
    </div>
  );
}
