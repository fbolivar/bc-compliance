'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { login } from '@/actions/auth'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = useCallback(async (formData: FormData) => {
    setLoading(true)
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }, [])

  return (
    <div className="space-y-8">
      {/* Logo + Brand */}
      <div className="flex flex-col items-center gap-4">
        <img src="/Logo.png" alt="BC Trust" className="h-16 w-auto" />
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-800">BC Trust</h1>
          <p className="text-sm text-slate-500 mt-1">Plataforma GRC &amp; SecOps</p>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800">Iniciar sesión</h2>
          <p className="text-sm text-slate-500 mt-1">Ingresa con tu cuenta corporativa</p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@organizacion.com"
              className="w-full px-3.5 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 transition-colors focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-sky-600 hover:text-sky-700 font-medium"
              >
                ¿Olvidaste?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pr-11 bg-white text-slate-800 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 transition-colors focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Verificando…' : 'Iniciar sesión'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400">
        BC Security · Acceso protegido
      </p>
    </div>
  )
}
