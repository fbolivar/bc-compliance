'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Search, Plus, Trash2, Eye } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  hideOnMobile?: boolean;
  priority?: number; // 1 = always show, 2 = hide on sm, 3 = hide on md
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  count: number;
  page: number;
  pageSize: number;
  basePath: string;
  createPath?: string;
  createLabel?: string;
  searchPlaceholder?: string;
  onDelete?: (id: string) => Promise<void>;
  idField?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  count,
  page,
  pageSize,
  basePath,
  createPath,
  createLabel = 'Crear nuevo',
  searchPlaceholder = 'Buscar...',
  onDelete,
  idField = 'id',
  emptyMessage = 'No hay registros',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const totalPages = Math.ceil(count / pageSize);

  const filteredData = search
    ? data.filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(search.toLowerCase())
        )
      )
    : data;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
          />
        </div>
        {createPath && (
          <Link
            href={createPath}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-cyan-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="sm:inline">{createLabel}</span>
          </Link>
        )}
      </div>

      {/* Mobile Card View (< md) */}
      <div className="md:hidden space-y-2">
        {filteredData.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-10 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <Search className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-400">{emptyMessage}</p>
            <p className="text-xs text-slate-600 mt-1">Intenta ajustar los filtros de busqueda</p>
          </div>
        ) : (
          filteredData.map((item, idx) => (
            <div
              key={String(item[idField]) || idx}
              className="bg-slate-900/50 border border-slate-800 border-l-2 border-l-cyan-500/30 rounded-xl p-3 space-y-2 hover:bg-slate-800/30 transition-colors"
            >
              {columns.slice(0, 4).map(col => (
                <div key={col.key} className="flex items-start justify-between gap-2">
                  <span className="text-xs text-slate-500 shrink-0">{col.label}</span>
                  <span className="text-sm text-slate-300 text-right">
                    {col.render ? col.render(item) : String(item[col.key] ?? '-')}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-800/50">
                <Link
                  href={`${basePath}/${item[idField]}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver
                </Link>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(String(item[idField]))}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/30">
                {columns.map(col => (
                  <th
                    key={col.key}
                    className={`px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest ${
                      col.hideOnMobile ? 'hidden lg:table-cell' : ''
                    } ${col.className || ''}`}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3.5 text-right text-xs font-medium text-slate-500 uppercase tracking-widest w-24">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <Search className="w-6 h-6 text-slate-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-400">{emptyMessage}</p>
                    <p className="text-xs text-slate-600 mt-1">Intenta ajustar los filtros de busqueda</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr
                    key={String(item[idField]) || idx}
                    className={`hover:bg-cyan-500/5 transition-colors ${idx % 2 === 1 ? 'bg-slate-800/10' : ''}`}
                  >
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className={`px-4 py-3.5 text-sm text-slate-300 ${
                          col.hideOnMobile ? 'hidden lg:table-cell' : ''
                        } ${col.className || ''}`}
                      >
                        {col.render ? col.render(item) : String(item[col.key] ?? '-')}
                      </td>
                    ))}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`${basePath}/${item[idField]}`}
                          className="p-2 text-slate-500 hover:text-cyan-400 rounded-lg hover:bg-slate-700/60 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {onDelete && (
                          <button
                            onClick={() => onDelete(String(item[idField]))}
                            className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-700/60 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-800/20">
            <p className="text-xs text-slate-500">
              <span className="font-medium text-slate-400">{count}</span> registros &middot; Pagina{' '}
              <span className="font-medium text-slate-400">{page}</span> de{' '}
              <span className="font-medium text-slate-400">{totalPages}</span>
            </p>
            <div className="flex items-center gap-1">
              <Link
                href={`${basePath}?page=${Math.max(1, page - 1)}`}
                className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-700 border border-transparent hover:border-slate-600 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <Link
                    key={pageNum}
                    href={`${basePath}?page=${pageNum}`}
                    className={`w-7 h-7 flex items-center justify-center text-xs rounded-lg border transition-all ${
                      pageNum === page
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-medium'
                        : 'text-slate-500 hover:text-white border-transparent hover:border-slate-600 hover:bg-slate-700'
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}
              <Link
                href={`${basePath}?page=${Math.min(totalPages, page + 1)}`}
                className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-700 border border-transparent hover:border-slate-600 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Pagination */}
      {totalPages > 1 && (
        <div className="md:hidden flex items-center justify-between px-1">
          <p className="text-xs text-slate-500">
            <span className="font-medium text-slate-400">{count}</span> registros &middot;{' '}
            <span className="font-medium text-slate-400">{page}</span>/{totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <Link
              href={`${basePath}?page=${Math.max(1, page - 1)}`}
              className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <span className="text-xs text-slate-400 px-1">
              {page} / {totalPages}
            </span>
            <Link
              href={`${basePath}?page=${Math.min(totalPages, page + 1)}`}
              className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
