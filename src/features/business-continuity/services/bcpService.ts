import { createClient } from '@/lib/supabase/server';
import { getById } from '@/shared/lib/service-helpers';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface BiaRecord {
  id: string;
  organization_id: string;
  process_name: string;
  process_owner: string | null;
  criticality: string;
  mdt_hours: number | null;
  rto_hours: number | null;
  rpo_hours: number | null;
  financial_impact: string | null;
  operational_impact: string | null;
  reputational_impact: string | null;
  legal_impact: string | null;
  dependencies: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BcpPlan {
  id: string;
  organization_id: string;
  code: string;
  title: string;
  version: string | null;
  status: string;
  scope: string | null;
  owner: string | null;
  approved_by: string | null;
  approved_at: string | null;
  activation_criteria: string | null;
  rto_target_hours: number | null;
  rpo_target_hours: number | null;
  last_test_date: string | null;
  next_test_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BcpProcedure {
  id: string;
  organization_id: string;
  bcp_plan_id: string;
  phase: string;
  step_number: number;
  title: string;
  description: string | null;
  responsible: string | null;
  estimated_hours: number | null;
  created_at: string;
}

export interface BcpTest {
  id: string;
  organization_id: string;
  bcp_plan_id: string;
  test_date: string;
  test_type: string;
  result: string;
  rto_achieved_hours: number | null;
  rpo_achieved_hours: number | null;
  findings: string | null;
  improvements: string | null;
  conducted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BcpStats {
  totalPlans: number;
  activePlans: number;
  totalBia: number;
  criticalProcesses: number;
  totalTests: number;
  lastTestDate: string | null;
  nextTestDate: string | null;
}

// ---------------------------------------------------------------------------
// BIA Records
// ---------------------------------------------------------------------------

export async function getBiaRecords(orgId: string): Promise<BiaRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bia_records')
    .select('*')
    .eq('organization_id', orgId)
    .order('criticality');

  if (error) throw new Error(`getBiaRecords: ${error.message}`);
  return (data ?? []) as BiaRecord[];
}

export async function getBiaRecordById(id: string): Promise<BiaRecord | null> {
  return getById<BiaRecord>('bia_records', id);
}

// ---------------------------------------------------------------------------
// BCP Plans
// ---------------------------------------------------------------------------

export async function getBcpPlans(orgId: string): Promise<BcpPlan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bcp_plans')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`getBcpPlans: ${error.message}`);
  return (data ?? []) as BcpPlan[];
}

export async function getBcpPlanById(id: string): Promise<BcpPlan | null> {
  return getById<BcpPlan>('bcp_plans', id);
}

// ---------------------------------------------------------------------------
// BCP Procedures
// ---------------------------------------------------------------------------

export async function getBcpProceduresByPlan(planId: string): Promise<BcpProcedure[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bcp_procedures')
    .select('*')
    .eq('bcp_plan_id', planId)
    .order('phase')
    .order('step_number');

  if (error) throw new Error(`getBcpProceduresByPlan: ${error.message}`);
  return (data ?? []) as BcpProcedure[];
}

// ---------------------------------------------------------------------------
// BCP Tests
// ---------------------------------------------------------------------------

export async function getBcpTests(orgId: string): Promise<BcpTest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bcp_tests')
    .select('*')
    .eq('organization_id', orgId)
    .order('test_date', { ascending: false });

  if (error) throw new Error(`getBcpTests: ${error.message}`);
  return (data ?? []) as BcpTest[];
}

export async function getBcpTestsByPlan(planId: string): Promise<BcpTest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bcp_tests')
    .select('*')
    .eq('bcp_plan_id', planId)
    .order('test_date', { ascending: false });

  if (error) throw new Error(`getBcpTestsByPlan: ${error.message}`);
  return (data ?? []) as BcpTest[];
}

// ---------------------------------------------------------------------------
// Dashboard Stats
// ---------------------------------------------------------------------------

export async function getBcpStats(orgId: string): Promise<BcpStats> {
  const supabase = await createClient();

  const [plansResult, biaResult, testsResult] = await Promise.all([
    supabase
      .from('bcp_plans')
      .select('id, status, next_test_date', { count: 'exact' })
      .eq('organization_id', orgId),
    supabase
      .from('bia_records')
      .select('id, criticality', { count: 'exact' })
      .eq('organization_id', orgId),
    supabase
      .from('bcp_tests')
      .select('test_date', { count: 'exact' })
      .eq('organization_id', orgId)
      .order('test_date', { ascending: false }),
  ]);

  const plans = (plansResult.data ?? []) as Pick<BcpPlan, 'id' | 'status' | 'next_test_date'>[];
  const biaRecords = (biaResult.data ?? []) as Pick<BiaRecord, 'id' | 'criticality'>[];
  const tests = (testsResult.data ?? []) as Pick<BcpTest, 'test_date'>[];

  const totalPlans = plansResult.count ?? 0;
  const activePlans = plans.filter((p) => p.status === 'active').length;
  const totalBia = biaResult.count ?? 0;
  const criticalProcesses = biaRecords.filter((r) => r.criticality === 'critical').length;
  const totalTests = testsResult.count ?? 0;

  const lastTestDate = tests.length > 0 ? tests[0].test_date : null;

  const futureDates = plans
    .map((p) => p.next_test_date)
    .filter((d): d is string => d !== null)
    .sort();
  const nextTestDate = futureDates.length > 0 ? futureDates[0] : null;

  return {
    totalPlans,
    activePlans,
    totalBia,
    criticalProcesses,
    totalTests,
    lastTestDate,
    nextTestDate,
  };
}
