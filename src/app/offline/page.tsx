'use client';

import { WifiOff, Shield } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-slate-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Sin conexion</h1>
          <p className="text-slate-500">
            No se pudo conectar al servidor. Verifica tu conexion a internet e intenta de nuevo.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-xl transition-colors"
        >
          Reintentar
        </button>
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <Shield className="w-4 h-4" />
          <span className="text-sm">BC Compliance</span>
        </div>
      </div>
    </div>
  );
}
