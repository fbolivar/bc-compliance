import { createClient } from '@/lib/supabase/server';

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function paginatedQuery<T>(
  table: string,
  orgId: string,
  params: PaginationParams = {},
  selectColumns: string = '*',
  filters?: Record<string, unknown>
): Promise<PaginatedResult<T>> {
  const supabase = await createClient();
  const page = params.page || 1;
  const pageSize = params.pageSize || 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(table)
    .select(selectColumns, { count: 'exact' })
    .eq('organization_id', orgId);

  // Apply additional filters
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value);
      }
    }
  }

  // Apply search (on 'name' column by default)
  if (params.search) {
    query = query.ilike('name', `%${params.search}%`);
  }

  // Apply sorting
  if (params.sortBy) {
    query = query.order(params.sortBy, { ascending: params.sortOrder !== 'desc' });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // Apply pagination
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Query error on ${table}: ${error.message}`);
  }

  return {
    data: (data || []) as T[],
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getById<T>(
  table: string,
  id: string,
  selectColumns: string = '*'
): Promise<T | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(table)
    .select(selectColumns)
    .eq('id', id)
    .single();

  if (error) return null;
  return data as T;
}

export async function insertRecord<T>(
  table: string,
  record: Record<string, unknown>
): Promise<T> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(table)
    .insert(record)
    .select()
    .single();

  if (error) throw new Error(`Insert error on ${table}: ${error.message}`);
  return data as T;
}

export async function updateRecord<T>(
  table: string,
  id: string,
  updates: Record<string, unknown>
): Promise<T> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Update error on ${table}: ${error.message}`);
  return data as T;
}

export async function deleteRecord(table: string, id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Delete error on ${table}: ${error.message}`);
}

export async function countRecords(
  table: string,
  orgId: string,
  filters?: Record<string, unknown>
): Promise<number> {
  const supabase = await createClient();
  let query = supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    }
  }

  const { count } = await query;
  return count || 0;
}
