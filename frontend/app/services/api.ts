const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ============ TIPOS ============
export interface Group {
  id: number;
  code: string;
  manufacturer: string;
  engine_model: string | null;
  cylinders: number;
  cylinder_configuration: string;
  nominal_power_mw: number;
  serial_number: string | null;
  active: boolean;
  status: string;
}

// Espelha backend/app/schemas/reading.py (OperationalReadingResponse)
export interface OperationalReading {
  id: number;
  group_id: number;
  group_code: string | null;
  timestamp: string;
  operator: string;
  status: string;
  operating_hours: number | null;
  power: number | null; // MW
  frequency: number | null; // Hz
  voltage: number | null; // V
  current_r: number | null; // A
  current_s: number | null; // A
  current_t: number | null; // A
  power_factor: number | null;
  reactive_power: number | null; // MVAr
  energy_produced: number | null; // MWh (acumulado)
  exhaust_temp_right: number | null; // °C
  exhaust_temp_left: number | null; // °C
  oil_temperature: number | null; // °C
  oil_pressure: number | null; // bar
  water_temperature: number | null; // °C
  intake_temperature: number | null; // °C
}

export interface ReadingPage {
  items: OperationalReading[];
  total: number;
  limit: number;
  offset: number;
}

export interface ReadingFilters {
  groupCode?: string;
  status?: string;
  start?: string; // ISO (YYYY-MM-DDTHH:mm:ss)
  end?: string;
  limit?: number;
  offset?: number;
}

// Espelha backend/app/schemas/dashboard.py
export interface DashboardGroup {
  id: number;
  code: string;
  manufacturer: string;
  nominal_power_mw: number;
  status: string;
  last_reading_at: string | null;
  power_mw: number | null;
  oil_temperature: number | null;
  water_temperature: number | null;
}

export interface DashboardSummary {
  total_groups: number;
  operating_groups: number;
  stopped_groups: number;
  maintenance_groups: number;
  installed_power_mw: number;
  operating_capacity_mw: number;
  current_power_mw: number;
  availability_pct: number;
  load_factor_pct: number;
  operating_capacity_pct: number;
  energy_24h_mwh: number;
  last_reading_at: string | null;
  groups: DashboardGroup[];
}

// Espelha backend/app/schemas/alert.py
export type AlertSeverity = 'WARNING' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface Alert {
  id: number;
  group_id: number;
  group_code: string | null;
  reading_id: number | null;
  parameter: string;
  parameter_label: string | null;
  unit: string | null;
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold: number;
  status: AlertStatus;
  created_at: string;
  updated_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface AlertPage {
  items: Alert[];
  total: number;
  limit: number;
  offset: number;
}

export interface AlertFilters {
  groupCode?: string;
  status?: AlertStatus | 'OPEN';
  severity?: AlertSeverity;
  limit?: number;
  offset?: number;
}

export interface AlertSummary {
  open: number;
  active: number;
  acknowledged: number;
  critical_open: number;
  warning_open: number;
  groups_with_open_alerts: string[];
  groups_with_critical_alerts: string[];
}

export interface AlertThreshold {
  id: number;
  parameter: string;
  label: string;
  unit: string;
  warning_min: number | null;
  warning_max: number | null;
  critical_min: number | null;
  critical_max: number | null;
  active: boolean;
}

export type ReadingInput = {
  group_code: string;
  timestamp?: string;
  operator: string;
  status: 'Em operação' | 'Parado' | 'Manutenção';
} & Partial<
  Pick<
    OperationalReading,
    | 'operating_hours'
    | 'power'
    | 'frequency'
    | 'voltage'
    | 'current_r'
    | 'current_s'
    | 'current_t'
    | 'power_factor'
    | 'reactive_power'
    | 'energy_produced'
    | 'exhaust_temp_right'
    | 'exhaust_temp_left'
    | 'oil_temperature'
    | 'oil_pressure'
    | 'water_temperature'
    | 'intake_temperature'
  >
>;

export interface ReadingCreateResult {
  reading: OperationalReading;
  evaluated: boolean;
  alerts_created: number;
  alerts_escalated: number;
  alerts_resolved: number;
}

// ============ GRUPOS ============
export async function getGroups(): Promise<Group[]> {
  const response = await fetch(`${API_BASE}/groups/`);
  if (!response.ok) throw new Error('Failed to fetch groups');
  return response.json();
}

export async function getGroupByCode(code: string): Promise<Group> {
  const response = await fetch(`${API_BASE}/groups/${code}`);
  if (!response.ok) throw new Error('Failed to fetch group');
  return response.json();
}

// ============ LEITURAS ============
export async function getReadings(filters: ReadingFilters = {}): Promise<ReadingPage> {
  const { groupCode, status, start, end, limit = 50, offset = 0 } = filters;
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (groupCode) params.set('group_code', groupCode);
  if (status) params.set('status', status);
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  const response = await fetch(`${API_BASE}/readings/?${params}`);
  if (!response.ok) throw new Error('Failed to fetch readings');
  return response.json();
}

export async function getGroupReadings(code: string, limit = 24): Promise<OperationalReading[]> {
  const response = await fetch(`${API_BASE}/groups/${code}/readings?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch group readings');
  return response.json();
}

export async function getLatestReading(code: string): Promise<OperationalReading | null> {
  const response = await fetch(`${API_BASE}/groups/${code}/readings/latest`);
  if (!response.ok) throw new Error('Failed to fetch latest reading');
  return response.json();
}

// ============ DASHBOARD ============
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch(`${API_BASE}/dashboard/summary`);
  if (!response.ok) throw new Error('Failed to fetch dashboard summary');
  return response.json();
}

// ============ ALERTAS ============
// Extrai a mensagem de erro devolvida pela API (FastAPI: { detail })
async function apiError(response: Response, fallback: string): Promise<Error> {
  try {
    const body = await response.json();
    if (typeof body.detail === 'string') return new Error(body.detail);
  } catch {
    // corpo sem JSON
  }
  return new Error(fallback);
}

export async function getAlerts(filters: AlertFilters = {}): Promise<AlertPage> {
  const { groupCode, status, severity, limit = 50, offset = 0 } = filters;
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (groupCode) params.set('group_code', groupCode);
  if (status) params.set('status', status);
  if (severity) params.set('severity', severity);
  const response = await fetch(`${API_BASE}/alerts/?${params}`);
  if (!response.ok) throw await apiError(response, 'Failed to fetch alerts');
  return response.json();
}

export async function getAlertSummary(): Promise<AlertSummary> {
  const response = await fetch(`${API_BASE}/alerts/summary`);
  if (!response.ok) throw await apiError(response, 'Failed to fetch alert summary');
  return response.json();
}

async function alertAction(alertId: number, action: 'acknowledge' | 'resolve', user: string) {
  const response = await fetch(`${API_BASE}/alerts/${alertId}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user }),
  });
  if (!response.ok) throw await apiError(response, `Failed to ${action} alert`);
  return (await response.json()) as Alert;
}

export function acknowledgeAlert(alertId: number, user = 'Operador'): Promise<Alert> {
  return alertAction(alertId, 'acknowledge', user);
}

export function resolveAlert(alertId: number, user = 'Operador'): Promise<Alert> {
  return alertAction(alertId, 'resolve', user);
}

export async function getThresholds(): Promise<AlertThreshold[]> {
  const response = await fetch(`${API_BASE}/thresholds/`);
  if (!response.ok) throw await apiError(response, 'Failed to fetch thresholds');
  return response.json();
}

export async function createReading(input: ReadingInput): Promise<ReadingCreateResult> {
  const response = await fetch(`${API_BASE}/readings/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await apiError(response, 'Erro ao registar a leitura');
  return response.json();
}

// ============ OCORRÊNCIAS ============
// Espelha backend/app/schemas/incident.py
export type IncidentType = 'ELETRICA' | 'MECANICA' | 'OPERACIONAL' | 'SEGURANCA' | 'OUTROS';
export type IncidentSeverity = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type IncidentStatus = 'ABERTA' | 'EM_ANALISE' | 'EM_EXECUCAO' | 'RESOLVIDA' | 'FECHADA';

export interface Incident {
  id: number;
  group_id: number;
  group_code: string | null;
  alert_id: number | null;
  title: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  cause: string | null;
  solution: string | null;
  operator: string;
  opened_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentUpdate {
  id: number;
  created_at: string;
  author: string;
  from_status: IncidentStatus | null;
  to_status: IncidentStatus | null;
  note: string | null;
}

export interface IncidentDetail extends Incident {
  updates: IncidentUpdate[];
  maintenance_orders: { id: number; title: string; status: MaintenanceStatus; scheduled_date: string }[];
}

export interface IncidentPage {
  items: Incident[];
  total: number;
  limit: number;
  offset: number;
}

export interface IncidentFilters {
  groupCode?: string;
  status?: IncidentStatus | 'OPEN';
  severity?: IncidentSeverity;
  type?: IncidentType;
  limit?: number;
  offset?: number;
}

export interface IncidentSummary {
  open: number;
  critical_open: number;
  by_status: Record<IncidentStatus, number>;
  resolved_last_30d: number;
  avg_resolution_hours: number | null;
}

export interface IncidentInput {
  group_code: string;
  alert_id?: number | null;
  title: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  operator: string;
}

// Transições permitidas (espelha INCIDENT_TRANSITIONS no backend)
export const INCIDENT_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  ABERTA: ['EM_ANALISE', 'EM_EXECUCAO', 'RESOLVIDA'],
  EM_ANALISE: ['EM_EXECUCAO', 'RESOLVIDA'],
  EM_EXECUCAO: ['EM_ANALISE', 'RESOLVIDA'],
  RESOLVIDA: ['FECHADA', 'ABERTA'],
  FECHADA: [],
};

async function request<T>(path: string, init: RequestInit | undefined, fallback: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  });
  if (!response.ok) throw await apiError(response, fallback);
  return response.json();
}

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') q.set(key, String(value));
  }
  return q.toString();
}

export function getIncidents(filters: IncidentFilters = {}): Promise<IncidentPage> {
  const { groupCode, status, severity, type, limit = 25, offset = 0 } = filters;
  const q = toQuery({ group_code: groupCode, status, severity, type, limit, offset });
  return request(`/incidents/?${q}`, undefined, 'Erro ao carregar ocorrências');
}

export function getIncidentSummary(): Promise<IncidentSummary> {
  return request('/incidents/summary', undefined, 'Erro ao carregar resumo de ocorrências');
}

export function getIncident(id: number): Promise<IncidentDetail> {
  return request(`/incidents/${id}`, undefined, 'Erro ao carregar a ocorrência');
}

export function createIncident(input: IncidentInput): Promise<IncidentDetail> {
  return request('/incidents/', { method: 'POST', body: JSON.stringify(input) }, 'Erro ao criar a ocorrência');
}

export function editIncident(
  id: number,
  changes: Partial<Pick<Incident, 'title' | 'type' | 'severity' | 'description' | 'cause' | 'solution'>>,
): Promise<IncidentDetail> {
  return request(`/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }, 'Erro ao guardar');
}

export function changeIncidentStatus(
  id: number,
  body: { status: IncidentStatus; author: string; note?: string; cause?: string; solution?: string },
): Promise<IncidentDetail> {
  return request(`/incidents/${id}/status`, { method: 'POST', body: JSON.stringify(body) }, 'Erro ao mudar o estado');
}

export function addIncidentNote(id: number, author: string, note: string): Promise<IncidentDetail> {
  return request(
    `/incidents/${id}/notes`,
    { method: 'POST', body: JSON.stringify({ author, note }) },
    'Erro ao adicionar a nota',
  );
}

// ============ MANUTENÇÃO ============
// Espelha backend/app/schemas/maintenance.py
export type MaintenanceType = 'PREVENTIVA' | 'CORRETIVA' | 'PREDITIVA' | 'URGENTE';
export type MaintenancePriority = 'BAIXA' | 'MEDIA' | 'ALTA';
export type MaintenanceStatus = 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export interface Maintenance {
  id: number;
  group_id: number;
  group_code: string | null;
  incident_id: number | null;
  type: MaintenanceType;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  scheduled_date: string;
  started_at: string | null;
  completed_date: string | null;
  technician: string;
  estimated_cost: number | null;
  actual_cost: number | null;
  work_hours: number | null;
  notes: string | null;
  overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaintenancePage {
  items: Maintenance[];
  total: number;
  limit: number;
  offset: number;
}

export interface MaintenanceFilters {
  groupCode?: string;
  status?: MaintenanceStatus | 'PENDING';
  type?: MaintenanceType;
  overdue?: boolean;
  limit?: number;
  offset?: number;
}

export interface MaintenanceSummary {
  scheduled: number;
  in_progress: number;
  overdue: number;
  completed_last_30d: number;
  cost_last_30d: number;
  estimated_pending_cost: number;
}

export interface MaintenanceInput {
  group_code: string;
  incident_id?: number | null;
  type: MaintenanceType;
  title: string;
  description?: string;
  priority: MaintenancePriority;
  scheduled_date: string;
  technician: string;
  estimated_cost?: number | null;
  notes?: string | null;
}

export function getMaintenance(filters: MaintenanceFilters = {}): Promise<MaintenancePage> {
  const { groupCode, status, type, overdue, limit = 25, offset = 0 } = filters;
  const q = toQuery({ group_code: groupCode, status, type, overdue, limit, offset });
  return request(`/maintenance/?${q}`, undefined, 'Erro ao carregar a manutenção');
}

export function getMaintenanceSummary(): Promise<MaintenanceSummary> {
  return request('/maintenance/summary', undefined, 'Erro ao carregar resumo de manutenção');
}

export function createMaintenance(input: MaintenanceInput): Promise<Maintenance> {
  return request('/maintenance/', { method: 'POST', body: JSON.stringify(input) }, 'Erro ao agendar a manutenção');
}

export function startMaintenance(id: number, setGroupMaintenance = true): Promise<Maintenance> {
  return request(
    `/maintenance/${id}/start`,
    { method: 'POST', body: JSON.stringify({ set_group_maintenance: setGroupMaintenance }) },
    'Erro ao iniciar a manutenção',
  );
}

export function completeMaintenance(
  id: number,
  body: { actual_cost?: number | null; work_hours?: number | null; notes?: string | null },
): Promise<Maintenance> {
  return request(`/maintenance/${id}/complete`, { method: 'POST', body: JSON.stringify(body) }, 'Erro ao concluir');
}

export function cancelMaintenance(id: number, reason: string): Promise<Maintenance> {
  return request(
    `/maintenance/${id}/cancel`,
    { method: 'POST', body: JSON.stringify({ reason }) },
    'Erro ao cancelar a manutenção',
  );
}

// ============ ESTATÍSTICAS ============
export interface StatisticsSummary {
  total_groups: number;
  active_groups: number;
  maintenance_groups: number;
  stopped_groups: number;
  total_power_mw: number;
  average_power_mw: number;
  total_running_hours: number;
  total_alerts: number;
  critical_alerts: number;
  open_incidents: number;
  total_maintenance_cost: number;
  pending_maintenance: number;
}

export interface GroupStatus {
  group_code: string;
  status: string;
  power_mw: number;
  temperature_c: number;
  running_hours: number;
}

export interface AlertStatistics {
  type: string;
  count: number;
}

export interface IncidentStatistics {
  group_code: string;
  total: number;
  open: number;
  resolved: number;
}

export interface MaintenanceStatistics {
  group_code: string;
  preventive: number;
  corrective: number;
  cost: number;
}

// Funções API (MOCK por enquanto)
const MOCK_STATISTICS: StatisticsSummary = {
  total_groups: 9,
  active_groups: 6,
  maintenance_groups: 2,
  stopped_groups: 1,
  total_power_mw: 8.24,
  average_power_mw: 0.92,
  total_running_hours: 87500,
  total_alerts: 12,
  critical_alerts: 3,
  open_incidents: 4,
  total_maintenance_cost: 15600,
  pending_maintenance: 3,
};

const MOCK_GROUP_STATUS: GroupStatus[] = [
  { group_code: 'GG1', status: 'Operando', power_mw: 0.81, temperature_c: 84.2, running_hours: 12543 },
  { group_code: 'GG2', status: 'Operando', power_mw: 0.76, temperature_c: 83.5, running_hours: 11876 },
  { group_code: 'GG3', status: 'Parado', power_mw: 0.00, temperature_c: 48.3, running_hours: 9876 },
  { group_code: 'GG4', status: 'Operando', power_mw: 0.83, temperature_c: 85.1, running_hours: 10987 },
  { group_code: 'GG5', status: 'Operando', power_mw: 0.79, temperature_c: 84.7, running_hours: 8765 },
  { group_code: 'GG6', status: 'Manutenção', power_mw: 0.00, temperature_c: 35.6, running_hours: 7654 },
  { group_code: 'GG7', status: 'Operando', power_mw: 0.80, temperature_c: 84.0, running_hours: 6543 },
  { group_code: 'GG8', status: 'Operando', power_mw: 2.11, temperature_c: 86.3, running_hours: 5432 },
  { group_code: 'GG9', status: 'Manutenção', power_mw: 0.00, temperature_c: 39.2, running_hours: 4321 },
];

const MOCK_ALERT_STATISTICS: AlertStatistics[] = [
  { type: 'CRITICAL', count: 3 },
  { type: 'WARNING', count: 5 },
  { type: 'INFO', count: 4 },
];

const MOCK_INCIDENT_STATISTICS: IncidentStatistics[] = [
  { group_code: 'GG1', total: 3, open: 1, resolved: 2 },
  { group_code: 'GG2', total: 2, open: 1, resolved: 1 },
  { group_code: 'GG3', total: 1, open: 1, resolved: 0 },
  { group_code: 'GG4', total: 2, open: 0, resolved: 2 },
  { group_code: 'GG8', total: 2, open: 1, resolved: 1 },
];

const MOCK_MAINTENANCE_STATISTICS: MaintenanceStatistics[] = [
  { group_code: 'GG1', preventive: 3, corrective: 1, cost: 4300 },
  { group_code: 'GG2', preventive: 2, corrective: 2, cost: 3800 },
  { group_code: 'GG4', preventive: 1, corrective: 0, cost: 1200 },
  { group_code: 'GG8', preventive: 2, corrective: 1, cost: 6300 },
];

export async function getStatisticsSummary(): Promise<StatisticsSummary> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_STATISTICS;
}

export async function getGroupStatus(): Promise<GroupStatus[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_GROUP_STATUS;
}

export async function getAlertStatistics(): Promise<AlertStatistics[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_ALERT_STATISTICS;
}

export async function getIncidentStatistics(): Promise<IncidentStatistics[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_INCIDENT_STATISTICS;
}

export async function getMaintenanceStatistics(): Promise<MaintenanceStatistics[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_MAINTENANCE_STATISTICS;
}




// ============ IMPORTAÇÃO ============
export interface ImportBatch {
  id: number;
  filename: string;
  file_type: 'EXCEL' | 'CSV';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  total_rows: number;
  successful_rows: number;
  error_rows: number;
  started_at: string;
  completed_at: string | null;
  created_by: string;
  created_at: string;
}

export interface ImportError {
  id: number;
  batch_id: number;
  row_number: number;
  column: string | null;
  error_message: string;
  raw_data: string | null;
  created_at: string;
}

export interface ImportPreview {
  headers: string[];
  rows: unknown[][];
  total_rows: number;
  has_errors: boolean;
}

// Funções API (MOCK por enquanto)
const MOCK_IMPORT_BATCHES: ImportBatch[] = [
  {
    id: 1,
    filename: 'leituras_setembro_2026.xlsx',
    file_type: 'EXCEL',
    status: 'COMPLETED',
    total_rows: 150,
    successful_rows: 148,
    error_rows: 2,
    started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    created_by: 'Carlos Manuel',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    filename: 'dados_operacionais_agosto.csv',
    file_type: 'CSV',
    status: 'COMPLETED',
    total_rows: 89,
    successful_rows: 87,
    error_rows: 2,
    started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    created_by: 'Ana Júlia',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    filename: 'manutencao_julho.xlsx',
    file_type: 'EXCEL',
    status: 'FAILED',
    total_rows: 45,
    successful_rows: 0,
    error_rows: 45,
    started_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
    created_by: 'Nelson Cadete',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    filename: 'leituras_junho_2026.xlsx',
    file_type: 'EXCEL',
    status: 'PROCESSING',
    total_rows: 200,
    successful_rows: 0,
    error_rows: 0,
    started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    completed_at: null,
    created_by: 'Carlos Manuel',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

const MOCK_IMPORT_ERRORS: ImportError[] = [
  {
    id: 1,
    batch_id: 1,
    row_number: 23,
    column: 'oil_temperature',
    error_message: 'Valor de temperatura fora do limite permitido (95°C)',
    raw_data: '{"oil_temperature": 102.5}',
    created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    batch_id: 1,
    row_number: 67,
    column: 'group_code',
    error_message: 'Código do grupo não encontrado: GG10',
    raw_data: '{"group_code": "GG10"}',
    created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    batch_id: 2,
    row_number: 34,
    column: 'timestamp',
    error_message: 'Formato de data inválido',
    raw_data: '{"timestamp": "2026-08-15 14:30"}',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    batch_id: 2,
    row_number: 56,
    column: 'active_power',
    error_message: 'Valor de potência negativo',
    raw_data: '{"active_power": -0.5}',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
  },
];

export async function getImportBatches(): Promise<ImportBatch[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_IMPORT_BATCHES;
}

export async function getImportErrors(batchId: number): Promise<ImportError[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_IMPORT_ERRORS.filter(e => e.batch_id === batchId);
}

export async function uploadFile(file: File): Promise<ImportBatch> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const newBatch: ImportBatch = {
    id: MOCK_IMPORT_BATCHES.length + 1,
    filename: file.name,
    file_type: file.name.endsWith('.csv') ? 'CSV' : 'EXCEL',
    status: 'PROCESSING',
    total_rows: Math.floor(Math.random() * 200) + 50,
    successful_rows: 0,
    error_rows: 0,
    started_at: new Date().toISOString(),
    completed_at: null,
    created_by: 'Usuário Atual',
    created_at: new Date().toISOString(),
  };
  
  MOCK_IMPORT_BATCHES.unshift(newBatch);
  
  // Simular processamento
  setTimeout(() => {
    const batch = MOCK_IMPORT_BATCHES.find(b => b.id === newBatch.id);
    if (batch) {
      batch.status = 'COMPLETED';
      batch.successful_rows = batch.total_rows - 3;
      batch.error_rows = 3;
      batch.completed_at = new Date().toISOString();
    }
  }, 2000);
  
  return newBatch;
}