import type { GroupStatus } from "@/app/types/reading";

export const groupStatusLabels: Record<GroupStatus, string> = {
  EM_OPERACAO: "Em operação",
  PARADO: "Parado",
  MANUTENCAO: "Em manutenção",
};

export const groupStatusStyles: Record<GroupStatus, string> = {
  EM_OPERACAO: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  PARADO: "bg-slate-100 text-slate-700 ring-slate-600/20",
  MANUTENCAO: "bg-amber-50 text-amber-800 ring-amber-600/20",
};

// Converte o estado devolvido pela API ("Em operação", "Parado", "Manutenção")
// para o identificador usado no frontend.
const apiStatusMap: Record<string, GroupStatus> = {
  "em operação": "EM_OPERACAO",
  parado: "PARADO",
  manutenção: "MANUTENCAO",
  "em manutenção": "MANUTENCAO",
};

export function toGroupStatus(apiStatus: string): GroupStatus {
  return apiStatusMap[apiStatus.trim().toLowerCase()] ?? "PARADO";
}
