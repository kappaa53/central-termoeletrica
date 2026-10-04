const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ============ SESSÃO ============
const TOKEN_KEY = 'ct.token';
export const AUTH_EXPIRED_EVENT = 'ct:auth-expired';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // armazenamento indisponível: a sessão dura apenas enquanto a página estiver aberta
  }
}

// fetch com o token de acesso; um 401 termina a sessão
async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(input, { ...init, headers });
  if (response.status === 401 && typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
  return response;
}

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
  operator?: string;
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
  const response = await authFetch(`${API_BASE}/groups/`);
  if (!response.ok) throw new Error('Failed to fetch groups');
  return response.json();
}

export async function getGroupByCode(code: string): Promise<Group> {
  const response = await authFetch(`${API_BASE}/groups/${code}`);
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
  const response = await authFetch(`${API_BASE}/readings/?${params}`);
  if (!response.ok) throw new Error('Failed to fetch readings');
  return response.json();
}

export async function getGroupReadings(code: string, limit = 24): Promise<OperationalReading[]> {
  const response = await authFetch(`${API_BASE}/groups/${code}/readings?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch group readings');
  return response.json();
}

export async function getLatestReading(code: string): Promise<OperationalReading | null> {
  const response = await authFetch(`${API_BASE}/groups/${code}/readings/latest`);
  if (!response.ok) throw new Error('Failed to fetch latest reading');
  return response.json();
}

// ============ DASHBOARD ============
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await authFetch(`${API_BASE}/dashboard/summary`);
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
  const response = await authFetch(`${API_BASE}/alerts/?${params}`);
  if (!response.ok) throw await apiError(response, 'Failed to fetch alerts');
  return response.json();
}

export async function getAlertSummary(): Promise<AlertSummary> {
  const response = await authFetch(`${API_BASE}/alerts/summary`);
  if (!response.ok) throw await apiError(response, 'Failed to fetch alert summary');
  return response.json();
}

async function alertAction(alertId: number, action: 'acknowledge' | 'resolve') {
  const response = await authFetch(`${API_BASE}/alerts/${alertId}/${action}`, { method: 'POST' });
  if (!response.ok) throw await apiError(response, `Failed to ${action} alert`);
  return (await response.json()) as Alert;
}

export function acknowledgeAlert(alertId: number): Promise<Alert> {
  return alertAction(alertId, 'acknowledge');
}

export function resolveAlert(alertId: number): Promise<Alert> {
  return alertAction(alertId, 'resolve');
}

export async function getThresholds(): Promise<AlertThreshold[]> {
  const response = await authFetch(`${API_BASE}/thresholds/`);
  if (!response.ok) throw await apiError(response, 'Failed to fetch thresholds');
  return response.json();
}

export async function createReading(input: ReadingInput): Promise<ReadingCreateResult> {
  const response = await authFetch(`${API_BASE}/readings/`, {
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
  const response = await authFetch(`${API_BASE}${path}`, {
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
  body: { status: IncidentStatus; note?: string; cause?: string; solution?: string },
): Promise<IncidentDetail> {
  return request(`/incidents/${id}/status`, { method: 'POST', body: JSON.stringify(body) }, 'Erro ao mudar o estado');
}

export function addIncidentNote(id: number, note: string): Promise<IncidentDetail> {
  return request(
    `/incidents/${id}/notes`,
    { method: 'POST', body: JSON.stringify({ note }) },
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

// ============ LIMITES DE ALARME ============
export type ThresholdInput = Pick<
  AlertThreshold,
  'warning_min' | 'warning_max' | 'critical_min' | 'critical_max' | 'active'
>;

export function updateThreshold(id: number, input: ThresholdInput): Promise<AlertThreshold> {
  return request(`/thresholds/${id}`, { method: 'PUT', body: JSON.stringify(input) }, 'Erro ao guardar o limite');
}

export function rebuildAlerts(): Promise<{ total_alerts: number }> {
  return request('/alerts/rebuild', { method: 'POST' }, 'Erro ao recalcular alertas');
}

// ============ AUTENTICAÇÃO E UTILIZADORES ============
export type RoleName = 'ADMIN' | 'GESTOR' | 'OPERADOR';

export interface Role {
  id: number;
  name: RoleName;
  description: string | null;
}

export interface User {
  id: number;
  name: string;
  username: string;
  role: Role;
  active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface LoginResult {
  access_token: string;
  token_type: string;
  expires_at: string;
  user: User;
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) throw await apiError(response, 'Não foi possível iniciar sessão');
  return response.json();
}

export function getMe(): Promise<User> {
  return request('/auth/me', undefined, 'Sessão inválida');
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await authFetch(`${API_BASE}/auth/me/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (!response.ok) throw await apiError(response, 'Erro ao alterar a palavra-passe');
}

export function getUsers(): Promise<User[]> {
  return request('/users/', undefined, 'Erro ao carregar utilizadores');
}

export function getRoles(): Promise<Role[]> {
  return request('/users/roles', undefined, 'Erro ao carregar perfis');
}

export function createUser(input: {
  name: string;
  username: string;
  role: RoleName;
  password: string;
}): Promise<User> {
  return request('/users/', { method: 'POST', body: JSON.stringify(input) }, 'Erro ao criar o utilizador');
}

export function updateUser(
  id: number,
  changes: Partial<{ name: string; role: RoleName; active: boolean }>,
): Promise<User> {
  return request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }, 'Erro ao atualizar');
}

export async function resetUserPassword(id: number, newPassword: string): Promise<void> {
  const response = await authFetch(`${API_BASE}/users/${id}/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_password: newPassword }),
  });
  if (!response.ok) throw await apiError(response, 'Erro ao redefinir a palavra-passe');
}

// ============ ESTATÍSTICAS ============
// Espelha backend/app/schemas/statistics.py
export interface StatisticsOverview {
  days: number;
  start: string;
  end: string;
  energy_mwh: number;
  avg_power_mw: number;
  availability_pct: number;
  utilization_pct: number;
  load_factor_pct: number;
  alerts_total: number;
  alerts_critical: number;
  incidents_opened: number;
  incidents_resolved: number;
  mttr_hours: number | null;
  maintenance_completed: number;
  maintenance_cost: number;
}

export interface DailyEnergy {
  day: string; // YYYY-MM-DD
  energy_mwh: number;
}

export interface GroupStatistics {
  code: string;
  manufacturer: string;
  nominal_power_mw: number;
  energy_mwh: number;
  availability_pct: number;
  utilization_pct: number;
  load_factor_pct: number | null;
  operating_hours: number;
  alerts: number;
  incidents: number;
  maintenance_cost: number;
}

export interface CountByKey {
  key: string;
  label: string;
  count: number;
}

export interface StatisticsReport {
  overview: StatisticsOverview;
  daily_energy: DailyEnergy[];
  groups: GroupStatistics[];
  alerts_by_parameter: CountByKey[];
  incidents_by_type: CountByKey[];
}

export function getStatistics(days: number): Promise<StatisticsReport> {
  return request(`/statistics/?days=${days}`, undefined, 'Erro ao carregar estatísticas');
}

// ============ IMPORTAÇÃO ============
// Espelha backend/app/schemas/imports.py
export interface ImportBatch {
  id: number;
  filename: string;
  file_type: 'EXCEL' | 'CSV';
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  total_rows: number;
  successful_rows: number;
  error_rows: number;
  alerts_created: number;
  created_by: string;
  created_at: string;
  completed_at: string | null;
}

export interface ImportRowError {
  id: number;
  row_number: number;
  column: string | null;
  error_message: string;
  raw_data: string | null;
}

export interface ImportPreview {
  filename: string;
  file_type: 'EXCEL' | 'CSV';
  columns: { header: string; field: string | null; label: string | null }[];
  missing_required: string[];
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  errors: { row_number: number; column: string | null; message: string }[];
  sample: Record<string, string | number>[];
}

async function uploadTo<T>(path: string, file: File, fallback: string): Promise<T> {
  const form = new FormData();
  form.append('file', file);
  const response = await authFetch(`${API_BASE}${path}`, { method: 'POST', body: form });
  if (!response.ok) throw await apiError(response, fallback);
  return response.json();
}

export function previewImport(file: File): Promise<ImportPreview> {
  return uploadTo('/imports/preview', file, 'Erro ao analisar o ficheiro');
}

export function runImport(file: File): Promise<ImportBatch> {
  return uploadTo('/imports/', file, 'Erro ao importar o ficheiro');
}

export function getImportBatches(): Promise<ImportBatch[]> {
  return request('/imports/', undefined, 'Erro ao carregar o histórico');
}

export function getImportErrors(batchId: number): Promise<ImportRowError[]> {
  return request(`/imports/${batchId}/errors`, undefined, 'Erro ao carregar os erros');
}

// Descarrega o modelo Excel (precisa do token, por isso não é um simples link)
export async function downloadImportTemplate(): Promise<void> {
  const response = await authFetch(`${API_BASE}/imports/template`);
  if (!response.ok) throw await apiError(response, 'Erro ao descarregar o modelo');
  const url = URL.createObjectURL(await response.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modelo_leituras.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}
