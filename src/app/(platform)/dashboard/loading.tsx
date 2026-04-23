export default function DashboardLoading() {
  return (
    <div className="space-y-6 pb-10 max-w-[1600px] mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-40 bg-slate-200 rounded" />
          <div className="h-7 w-72 bg-slate-300 rounded" />
          <div className="h-3 w-96 bg-slate-200 rounded" />
        </div>
        <div className="h-9 w-44 bg-slate-200 rounded-lg" />
      </div>

      {/* Hero skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-[260px] grid grid-cols-[auto,1fr] gap-6">
        <div className="w-[260px] h-full bg-slate-100 rounded-xl" />
        <div className="space-y-4">
          <div className="h-5 w-2/3 bg-slate-200 rounded" />
          <div className="h-3 w-full bg-slate-100 rounded" />
          <div className="h-3 w-4/5 bg-slate-100 rounded" />
          <div className="h-2 w-full bg-slate-100 rounded-full mt-12" />
        </div>
      </div>

      {/* PHVA skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-1/3 bg-slate-200 rounded mb-5" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-100 rounded-xl p-4 h-[160px]" />
          ))}
        </div>
      </div>

      {/* SecOps skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 h-[200px]">
            <div className="h-4 w-1/2 bg-slate-200 rounded mb-3" />
            <div className="h-9 w-1/3 bg-slate-300 rounded mt-4" />
            <div className="space-y-2 mt-6">
              <div className="h-2 w-full bg-slate-100 rounded" />
              <div className="h-2 w-3/4 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[400px] rounded-2xl border border-slate-200 bg-white" />
        <div className="h-[400px] rounded-2xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}
