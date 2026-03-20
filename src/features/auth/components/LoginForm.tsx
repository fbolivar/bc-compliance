'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { login } from '@/actions/auth'
import { Shield, Lock, Mail, Eye, EyeOff, Fingerprint, AlertTriangle } from 'lucide-react'

function HexagonGrid() {
  const [cells, setCells] = useState<number[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setCells(prev => {
        const next = [...prev]
        const idx = Math.floor(Math.random() * 35)
        if (next.includes(idx)) {
          return next.filter(i => i !== idx)
        }
        if (next.length > 6) next.shift()
        return [...next, idx]
      })
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="grid grid-cols-7 gap-3 opacity-20 p-4">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className={`w-full aspect-square rounded-lg transition-all duration-1000 ${
              cells.includes(i)
                ? 'bg-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-slate-800/20'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

function SecurityScanLine() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent animate-[scan_4s_ease-in-out_infinite]" />
    </div>
  )
}

function StatusIndicator({ label, status }: { label: string; status: 'secure' | 'active' }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`w-1.5 h-1.5 rounded-full ${
        status === 'secure' ? 'bg-emerald-400' : 'bg-cyan-400'
      } animate-pulse`} />
      <span className="text-slate-500 font-mono uppercase tracking-wider">{label}</span>
    </div>
  )
}

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour12: false }))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = useCallback(async (formData: FormData) => {
    setLoading(true)
    setError(null)
    setAuthenticated(false)

    const result = await login(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setAuthenticated(true)
    }
  }, [])

  return (
    <div className="relative">
      {/* Background animation */}
      <HexagonGrid />

      {/* Main card */}
      <div className="relative">
        {/* Top status bar */}
        <div className="flex items-center justify-between px-4 py-2 mb-4">
          <div className="flex items-center gap-4">
            <StatusIndicator label="TLS 1.3" status="secure" />
            <StatusIndicator label="Encrypted" status="secure" />
          </div>
          <span className="text-xs font-mono text-slate-600">{time}</span>
        </div>

        {/* Card */}
        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/5">
          <SecurityScanLine />

          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-800/50">
            <div className="flex flex-col items-center gap-3 mb-6">
              <img src="/Logo.png" alt="BC Trust" className="h-16 w-auto" />
              <div className="text-center">
                <p className="text-xs text-slate-500 font-mono">
                  SGSI - Gestion de Seguridad Digital
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-200">
                Acceso al Sistema
              </h2>
              <p className="text-sm text-slate-500">
                Autenticacion requerida para acceder al centro de comando
              </p>
            </div>
          </div>

          {/* Form */}
          <form action={handleSubmit} className="px-8 py-6 space-y-5">
            {/* Email field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5" />
                Identificacion
              </label>
              <div className={`relative group transition-all duration-300 ${
                focusedField === 'email' ? 'scale-[1.01]' : ''
              }`}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="operador@bc-trust.com"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-3 bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-xl placeholder:text-slate-600 font-mono text-sm transition-all duration-300 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-800/80 focus:shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:border-slate-600"
                />
                <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none ${
                  focusedField === 'email' ? 'opacity-100' : 'opacity-0'
                } bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5`} />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                <Fingerprint className="w-3.5 h-3.5" />
                Clave de Acceso
              </label>
              <div className={`relative group transition-all duration-300 ${
                focusedField === 'password' ? 'scale-[1.01]' : ''
              }`}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-3 pr-12 bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-xl placeholder:text-slate-600 font-mono text-sm transition-all duration-300 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-800/80 focus:shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:border-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-cyan-400 transition-colors p-1"
                  aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
                <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none ${
                  focusedField === 'password' ? 'opacity-100' : 'opacity-0'
                } bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5`} />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-[fadeIn_0.3s_ease-out]">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <p className="text-sm text-rose-300">{error}</p>
              </div>
            )}

            {/* Success state */}
            {authenticated && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-4 h-4 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-sm text-emerald-300 font-mono">Acceso concedido. Redirigiendo...</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verificando credenciales...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Iniciar Sesion Segura
                  </>
                )}
              </span>
            </button>

            {/* Forgot password */}
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-xs text-slate-600 hover:text-cyan-400 transition-colors font-mono"
              >
                Recuperar acceso
              </Link>
            </div>
          </form>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-slate-800/50 bg-slate-900/50">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-700 uppercase tracking-widest">
              <span>AES-256 Encrypted</span>
              <span>Zero Trust</span>
              <span>MFA Ready</span>
            </div>
          </div>
        </div>

        {/* Bottom info */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-700 font-mono">
            BC Security &copy; {new Date().getFullYear()} &middot; Acceso restringido
          </p>
        </div>
      </div>
    </div>
  )
}
