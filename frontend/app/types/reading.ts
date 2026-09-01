export type GroupStatus =
  | "EM_OPERACAO"
  | "PARADO"
  | "MANUTENCAO";

export interface OperationalReading {
  id: number;
  groupCode: string;
  readingDatetime: string;
  operatorName: string;
  groupStatus: GroupStatus;
  statusReason?: string;
  operatingHours: number;
  powerMw: number | null;
  frequencyHz: number | null;
  voltageV: number | null;
  currentRA: number | null;
  currentSA: number | null;
  currentTA: number | null;
  powerFactor: number | null;
  oilTemperatureC: number | null;
  oilPressureBar: number | null;
  waterTemperatureC: number | null;
}