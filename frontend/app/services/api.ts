const API_BASE_URL = 'http://127.0.0.1:8000';

export interface Group {
  id: number;
  code: string;           // 'GG1', 'GG2', etc.
  manufacturer: string;   // 'Guascor' ou 'Waukesha'
  engine_model: string | null;
  cylinders: number;      // 16 ou 12
  cylinder_configuration: string; // 'V'
  nominal_power_mw: number; // 0.952 ou 2.4
  serial_number: string | null;
  active: boolean;
  status: string;         // 'Em operação', 'Parado', 'Manutenção'
}

export interface OperationalReading {
  id: number;
  group_id: number;
  timestamp: string;
  operator: string;
  status: string;
  operating_hours: number | null;
  power: number | null;
  frequency: number | null;
  voltage: number | null;
  current_r: number | null;
  current_s: number | null;
  current_t: number | null;
  power_factor: number | null;
  reactive_power: number | null;
  energy_produced: number | null;
  exhaust_temp_right: number | null;
  exhaust_temp_left: number | null;
  oil_temperature: number | null;
  oil_pressure: number | null;
  water_temperature: number | null;
  intake_temperature: number | null;
}

export const api = {
  // Groups
  getGroups: async (): Promise<Group[]> => {
    const response = await fetch(`${API_BASE_URL}/groups`);
    if (!response.ok) throw new Error('Failed to fetch groups');
    return response.json();
  },
  
  getGroupByCode: async (code: string): Promise<Group> => {
    const response = await fetch(`${API_BASE_URL}/groups/${code}`);
    if (!response.ok) throw new Error(`Failed to fetch group ${code}`);
    return response.json();
  },
  
  // Readings
  getLatestReading: async (groupId: number): Promise<OperationalReading | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/readings/latest?group_id=${groupId}`);
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  },
  
  getReadings: async (groupId: number, limit: number = 24): Promise<OperationalReading[]> => {
    const response = await fetch(`${API_BASE_URL}/readings?group_id=${groupId}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch readings');
    return response.json();
  },
};