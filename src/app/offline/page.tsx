'use client';

import { WifiOff, Shield } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Sin conexion</h1>
          <p className="text-slate-400">
            No se pudo conectar al servidor. Verifica tu conexion a internet e intenta de nuevo.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-medium rounded-xl transition-colors"
        >
          Reintentar
        </button>
        <div className="flex items-center justify-center gap-2 text-slate-600">
          <Shield className="w-4 h-4" />
          <span className="text-sm">BC Compliance</span>
        </div>
      </div>
    </div>
  );
}
