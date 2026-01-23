// ===========================================
// Domain Models (matching backend SQLAlchemy models)
// ===========================================

export type Currency = 'CHF' | 'EUR';

export interface Client {
  id: string;
  name: string;
  short_name: string | null;
  currency: Currency;
  default_hourly_rate: number;
  hour_budget: number | null;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  hours_logged?: number;
}

export interface Project {
  id: string;
  client_id: string;
  client_name: string;
  name: string;
  short_name: string | null;
  hourly_rate_override: number | null;
  effective_hourly_rate: number;
  currency: Currency;
  hour_budget: number | null;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  hours_logged?: number;
}

export interface TimeAllocation {
  id: string;
  date: string;
  project_id: string;
  project_name: string;
  client_name: string;
  hours: number;
  notes: string | null;
  created_at: string;
}

export interface WorkSession {
  id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  duration_hours: number | null;
  is_active: boolean;
}

// ===========================================
// API Response Wrappers
// ===========================================

export interface ClientsResponse {
  clients: Client[];
}

export interface ClientResponse {
  client: Client;
}

export interface ProjectsResponse {
  projects: Project[];
}

export interface ProjectResponse {
  project: Project;
}

export interface AllocationsResponse {
  allocations: TimeAllocation[];
  total_allocated: number;
  completed_hours: number;
}

export interface AllocationResponse {
  allocation: TimeAllocation;
}

export interface SessionsResponse {
  sessions: WorkSession[];
  completed_hours: number;
  active_session: WorkSession | null;
}

export interface SessionResponse {
  session: WorkSession;
}

export interface AuthCheckResponse {
  authenticated: boolean;
}

export interface AuthLoginResponse {
  message: string;
}

// ===========================================
// Report Types
// ===========================================

export interface MonthlyReportItem {
  project_name: string;
  hours: number;
  income: number;
  currency: Currency;
}

export interface DailyHoursItem {
  date: string;
  project_name: string;
  client_name: string;
  hours: number;
}

export interface DailySummaryItem {
  project_name: string;
  hours: number;
}

// ===========================================
// Form/Input Types (for create/update operations)
// ===========================================

export interface ClientFormData {
  name: string;
  short_name?: string;
  currency: Currency;
  default_hourly_rate: number;
  hour_budget?: number | null;
}

export interface ClientUpdateData {
  name?: string;
  short_name?: string;
  currency?: Currency;
  default_hourly_rate?: number;
  hour_budget?: number | null;
  is_active?: boolean;
}

export interface ProjectFormData {
  client_id: string;
  name: string;
  short_name?: string;
  hourly_rate_override?: number | null;
  hour_budget?: number | null;
}

export interface ProjectUpdateData {
  name?: string;
  short_name?: string;
  hourly_rate_override?: number | null;
  hour_budget?: number | null;
  is_active?: boolean;
}

export interface AllocationFormData {
  date: string;
  project_id: string;
  hours: number;
  notes: string | null;
}

export interface AllocationUpdateData {
  project_id?: string;
  hours?: number;
  notes?: string | null;
}

export interface SessionFormData {
  date: string;
  start_time: string;
  end_time: string;
}

export interface SessionUpdateData {
  start_time?: string;
  end_time?: string;
}

// ===========================================
// Component Prop Types
// ===========================================

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

// ===========================================
// Hook Return Types
// ===========================================

export interface DailyTotals {
  totalClocked: number;
  unallocated: number;
  totalAllocated: number;
  activeElapsedHours: number;
  activeSession: WorkSession | null;
}
