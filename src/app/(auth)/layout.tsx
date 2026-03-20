export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 flex items-center justify-center relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.4]" style={{
        backgroundImage: `linear-gradient(rgba(14,165,233,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.06) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Soft light orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-sky-200/30 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-200/30 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-100/20 rounded-full blur-[200px]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        {children}
      </div>
    </div>
  )
}
