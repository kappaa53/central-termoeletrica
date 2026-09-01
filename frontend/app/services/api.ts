
const API_BASE = 'http://localhost:8000';

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

export interface OperationalReading {
  id: number;
  group_id: number;
  timestamp: string;
  active_power_mw: number;
  reactive_power_mvar: number;
  voltage_v: number;
  current_a: number;
  frequency_hz: number;
  oil_pressure_bar: number;
  oil_temperature_c: number;
  coolant_temperature_c: number;
  exhaust_temperature_c: number;
  rpm: number;
  running_hours: number;
}

export interface Alert {
  id: number;
  group_id: number;
  group_code: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  parameter: string;
  value: number;
  threshold: number;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  created_at: string;
  resolved_at: string | null;
  acknowledged_by: string | null;
}

// ============ GRUPOS ============
export async function getGroups(): Promise<Group[]> {
  const response = await fetch(`${API_BASE}/groups`);
  if (!response.ok) throw new Error('Failed to fetch groups');
  return response.json();
}

export async function getGroupByCode(code: string): Promise<Group> {
  const response = await fetch(`${API_BASE}/groups/${code}`);
  if (!response.ok) throw new Error('Failed to fetch group');
  return response.json();
}

// ============ LEITURAS ============
export async function getGroupReadings(
  groupCode: string,
  limit: number = 20
): Promise<OperationalReading[]> {
  const response = await fetch(`${API_BASE}/groups/${groupCode}/readings?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch readings');
  return response.json();
}

export async function getLatestReading(groupCode: string): Promise<OperationalReading | null> {
  const response = await fetch(`${API_BASE}/groups/${groupCode}/readings/latest`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to fetch latest reading');
  return response.json();
}

// ============ ALERTAS ============
export async function getAlerts(groupCode?: string): Promise<Alert[]> {
  const url = groupCode 
    ? `${API_BASE}/alerts?group_code=${groupCode}`
    : `${API_BASE}/alerts`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch alerts');
  return response.json();
}

export async function acknowledgeAlert(alertId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to acknowledge alert');
}

export async function resolveAlert(alertId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to resolve alert');
}
// ============ OCORRÊNCIAS ============
export interface Incident {
  id: number;
  group_id: number;
  group_code: string;
  title: string;
  type: 'ELETRICA' | 'MECANICA' | 'OPERACIONAL' | 'SEGURANCA' | 'OUTROS';
  severity: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  status: 'ABERTA' | 'EM_ANALISE' | 'EM_EXECUCAO' | 'RESOLVIDA' | 'FECHADA';
  description: string;
  cause: string | null;
  solution: string | null;
  operator: string;
  opened_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

// Funções API (MOCK por enquanto)
export async function getIncidents(groupCode?: string): Promise<Incident[]> {
  // Simular delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Retornar dados MOCK
  return MOCK_INCIDENTS;
}

export async function getIncidentById(id: number): Promise<Incident | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const incident = MOCK_INCIDENTS.find(inc => inc.id === id);
  return incident || null;
}

export async function createIncident(data: Partial<Incident>): Promise<Incident> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newIncident: Incident = {
    id: MOCK_INCIDENTS.length + 1,
    group_id: data.group_id || 1,
    group_code: data.group_code || 'GG1',
    title: data.title || 'Nova ocorrência',
    type: data.type || 'OPERACIONAL',
    severity: data.severity || 'MEDIA',
    status: 'ABERTA',
    description: data.description || '',
    cause: null,
    solution: null,
    operator: data.operator || 'Usuário',
    opened_at: new Date().toISOString(),
    resolved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  MOCK_INCIDENTS.unshift(newIncident);
  return newIncident;
}

export async function updateIncidentStatus(id: number, status: Incident['status']): Promise<Incident> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const incident = MOCK_INCIDENTS.find(inc => inc.id === id);
  if (!incident) throw new Error('Incidente não encontrado');
  
  incident.status = status;
  if (status === 'RESOLVIDA' || status === 'FECHADA') {
    incident.resolved_at = new Date().toISOString();
  }
  incident.updated_at = new Date().toISOString();
  return incident;
}

// Dados MOCK
const MOCK_INCIDENTS: Incident[] = [
  {
    id: 1,
    group_id: 1,
    group_code: 'GG1',
    title: 'Superaquecimento do motor',
    type: 'MECANICA',
    severity: 'ALTA',
    status: 'EM_EXECUCAO',
    description: 'Temperatura do óleo atingiu 97°C durante operação normal. Sistema de refrigeração apresentou falha.',
    cause: 'Válvula termostática com defeito',
    solution: 'Substituição da válvula em andamento',
    operator: 'Carlos Manuel',
    opened_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    resolved_at: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    group_id: 2,
    group_code: 'GG2',
    title: 'Vibração excessiva no eixo',
    type: 'MECANICA',
    severity: 'CRITICA',
    status: 'EM_ANALISE',
    description: 'Medição de vibração acima do limite operacional. Possível desalinhamento.',
    cause: null,
    solution: null,
    operator: 'Nelson Cadete',
    opened_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    resolved_at: null,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    group_id: 3,
    group_code: 'GG3',
    title: 'Falha no sistema de partida',
    type: 'ELETRICA',
    severity: 'MEDIA',
    status: 'ABERTA',
    description: 'Motor não inicia na tentativa de partida. Bateria apresenta baixa tensão.',
    cause: null,
    solution: null,
    operator: 'Ana Júlia',
    opened_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    resolved_at: null,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    group_id: 4,
    group_code: 'GG4',
    title: 'Vazamento de óleo no cárter',
    type: 'MECANICA',
    severity: 'BAIXA',
    status: 'RESOLVIDA',
    description: 'Pequeno vazamento identificado na junta do cárter.',
    cause: 'Junta ressecada por tempo de uso',
    solution: 'Substituição da junta e limpeza da área',
    operator: 'Carlos Manuel',
    opened_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    group_id: 8,
    group_code: 'GG8',
    title: 'Sobrecarga no gerador',
    type: 'OPERACIONAL',
    severity: 'ALTA',
    status: 'EM_EXECUCAO',
    description: 'Potência ativa excedeu 2.3 MW durante pico de demanda.',
    cause: 'Demanda elevada na rede',
    solution: 'Redistribuição de carga entre os grupos',
    operator: 'Ana Júlia',
    opened_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    resolved_at: null,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

// frontend/app/services/api.ts 

// ============ MANUTENÇÃO ============
export interface Maintenance {
  id: number;
  group_id: number;
  group_code: string;
  type: 'PREVENTIVA' | 'CORRETIVA' | 'PREDITIVA' | 'URGENTE';
  title: string;
  description: string;
  priority: 'BAIXA' | 'MEDIA' | 'ALTA';
  status: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
  scheduled_date: string;
  completed_date: string | null;
  technician: string;
  estimated_cost: number | null;
  actual_cost: number | null;
  work_hours: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Funções API (MOCK por enquanto)
const MOCK_MAINTENANCE: Maintenance[] = [
  {
    id: 1,
    group_id: 1,
    group_code: 'GG1',
    type: 'PREVENTIVA',
    title: 'Troca de óleo e filtros',
    description: 'Manutenção preventiva conforme plano de manutenção',
    priority: 'MEDIA',
    status: 'CONCLUIDA',
    scheduled_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    completed_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    technician: 'Carlos Manuel',
    estimated_cost: 2500,
    actual_cost: 2300,
    work_hours: 4,
    notes: 'Óleo e filtros substituídos com sucesso',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    group_id: 2,
    group_code: 'GG2',
    type: 'CORRETIVA',
    title: 'Substituição de válvula termostática',
    description: 'Válvula apresentando falha, substituição necessária',
    priority: 'ALTA',
    status: 'EM_ANDAMENTO',
    scheduled_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    completed_date: null,
    technician: 'Nelson Cadete',
    estimated_cost: 1500,
    actual_cost: null,
    work_hours: null,
    notes: 'Aguardando peça',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    group_id: 3,
    group_code: 'GG3',
    type: 'PREDITIVA',
    title: 'Análise de vibração',
    description: 'Monitoramento preditivo para detectar desgaste',
    priority: 'BAIXA',
    status: 'AGENDADA',
    scheduled_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    completed_date: null,
    technician: 'Ana Júlia',
    estimated_cost: 800,
    actual_cost: null,
    work_hours: null,
    notes: 'Agendado para próxima semana',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    group_id: 4,
    group_code: 'GG4',
    type: 'URGENTE',
    title: 'Vazamento de óleo no cárter',
    description: 'Vazamento identificado, intervenção imediata necessária',
    priority: 'ALTA',
    status: 'AGENDADA',
    scheduled_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    completed_date: null,
    technician: 'Carlos Manuel',
    estimated_cost: 3000,
    actual_cost: null,
    work_hours: null,
    notes: 'Prioridade alta, equipe em alerta',
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    group_id: 8,
    group_code: 'GG8',
    type: 'PREVENTIVA',
    title: 'Revisão geral do gerador',
    description: 'Revisão completa conforme manual do fabricante',
    priority: 'MEDIA',
    status: 'CONCLUIDA',
    scheduled_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    completed_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    technician: 'Ana Júlia',
    estimated_cost: 5000,
    actual_cost: 4800,
    work_hours: 8,
    notes: 'Todas as especificações atendidas',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export async function getMaintenance(groupCode?: string): Promise<Maintenance[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  if (groupCode) {
    return MOCK_MAINTENANCE.filter(m => m.group_code === groupCode);
  }
  return MOCK_MAINTENANCE;
}

export async function getMaintenanceById(id: number): Promise<Maintenance | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const maintenance = MOCK_MAINTENANCE.find(m => m.id === id);
  return maintenance || null;
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
  rows: any[][];
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