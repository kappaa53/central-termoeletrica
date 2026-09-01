
'use client';

import { useEffect, useState } from 'react';
import { 
  getStatisticsSummary,
  getGroupStatus,
  getAlertStatistics,
  getIncidentStatistics,
  getMaintenanceStatistics,
  StatisticsSummary,
  GroupStatus,
  AlertStatistics,
  IncidentStatistics,
  MaintenanceStatistics
} from '@/app/services/api';

import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  PowerIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function StatisticsPage() {
  const [summary, setSummary] = useState<StatisticsSummary | null>(null);
  const [groupStatus, setGroupStatus] = useState<GroupStatus[]>([]);
  const [alertStats, setAlertStats] = useState<AlertStatistics[]>([]);
  const [incidentStats, setIncidentStats] = useState<IncidentStatistics[]>([]);
  const [maintenanceStats, setMaintenanceStats] = useState<MaintenanceStatistics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStatistics() {
      try {
        setLoading(true);
        const [summaryData, groupData, alertData, incidentData, maintenanceData] = await Promise.all([
          getStatisticsSummary(),
          getGroupStatus(),
          getAlertStatistics(),
          getIncidentStatistics(),
          getMaintenanceStatistics()
        ]);
        setSummary(summaryData);
        setGroupStatus(groupData);
        setAlertStats(alertData);
        setIncidentStats(incidentData);
        setMaintenanceStats(maintenanceData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStatistics();
  }, []);

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando estatísticas...</div>
      </div>
    );
  }

  // Cálculo para gráfico de barras
  const maxPower = Math.max(...groupStatus.map(g => g.power_mw));
  const maxTemp = Math.max(...groupStatus.map(g => g.temperature_c));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Estatísticas</h1>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Total de Grupos</div>
              <div className="text-2xl font-bold">{summary.total_groups}</div>
              <div className="text-xs text-green-600">{summary.active_groups} em operação</div>
            </div>
            <PowerIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Potência Total</div>
              <div className="text-2xl font-bold">{summary.total_power_mw} MW</div>
              <div className="text-xs text-gray-500">Média: {summary.average_power_mw} MW</div>
            </div>
            <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Alertas Críticos</div>
              <div className="text-2xl font-bold text-red-600">{summary.critical_alerts}</div>
              <div className="text-xs text-gray-500">Total: {summary.total_alerts}</div>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Manutenção</div>
              <div className="text-2xl font-bold">{summary.pending_maintenance}</div>
              <div className="text-xs text-gray-500">
                Custo: {summary.total_maintenance_cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
            <WrenchScrewdriverIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico: Potência por Grupo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Potência por Grupo (MW)</h2>
          <div className="space-y-3">
            {groupStatus.map((group) => (
              <div key={group.group_code}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{group.group_code}</span>
                  <span className="text-gray-600">{group.power_mw.toFixed(2)} MW</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      group.power_mw > 2 ? 'bg-purple-600' :
                      group.power_mw > 0.5 ? 'bg-blue-600' :
                      'bg-gray-400'
                    }`}
                    style={{ width: `${maxPower > 0 ? (group.power_mw / maxPower) * 100 : 0}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {group.status} • {group.running_hours}h
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico: Temperaturas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Temperatura do Óleo (°C)</h2>
          <div className="space-y-3">
            {groupStatus.map((group) => (
              <div key={group.group_code}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{group.group_code}</span>
                  <span className={`font-medium ${
                    group.temperature_c > 85 ? 'text-red-600' :
                    group.temperature_c > 80 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {group.temperature_c.toFixed(1)} °C
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      group.temperature_c > 85 ? 'bg-red-600' :
                      group.temperature_c > 80 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${maxTemp > 0 ? (group.temperature_c / maxTemp) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between text-xs text-gray-500">
            <span>Limite: 85°C</span>
            <span>Crítico: 95°C</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertas por Tipo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Alertas por Tipo</h2>
          <div className="space-y-3">
            {alertStats.map((stat) => (
              <div key={stat.type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className={`font-medium ${
                    stat.type === 'CRITICAL' ? 'text-red-600' :
                    stat.type === 'WARNING' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {stat.type}
                  </span>
                  <span>{stat.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      stat.type === 'CRITICAL' ? 'bg-red-600' :
                      stat.type === 'WARNING' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${(stat.count / summary.total_alerts) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ocorrências por Grupo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Ocorrências por Grupo</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {incidentStats.map((stat) => (
              <div key={stat.group_code} className="flex items-center justify-between border-b pb-2">
                <div>
                  <span className="font-medium">{stat.group_code}</span>
                  <div className="text-xs text-gray-500">
                    {stat.open} abertas • {stat.resolved} resolvidas
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold">{stat.total}</span>
                  <div className="flex space-x-1">
                    <span className="inline-block w-3 h-3 bg-red-500 rounded-full" title={`${stat.open} abertas`} />
                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full" title={`${stat.resolved} resolvidas`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manutenção por Grupo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Manutenção por Grupo</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {maintenanceStats.map((stat) => (
              <div key={stat.group_code} className="border-b pb-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{stat.group_code}</span>
                  <span className="text-sm font-bold text-green-600">
                    {stat.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex space-x-3 text-xs text-gray-500 mt-1">
                  <span>Preventiva: {stat.preventive}</span>
                  <span>Corretiva: {stat.corrective}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="mt-6 text-center text-sm text-gray-400 border-t pt-4">
        Dados atualizados em tempo real • {new Date().toLocaleString()}
      </div>
    </div>
  );
}