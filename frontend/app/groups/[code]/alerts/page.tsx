
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Alert } from '@/app/services/api';
import Link from 'next/link';

const MOCK_ALERTS_BY_GROUP: Record<string, Alert[]> = {
  'GG1': [
    {
      id: 1,
      group_id: 1,
      group_code: 'GG1',
      type: 'CRITICAL',
      message: 'Temperatura do óleo acima do limite crítico',
      parameter: 'oil_temperature',
      value: 97.5,
      threshold: 95,
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 5 * 60000).toISOString(),
      resolved_at: null,
      acknowledged_by: null
    }
  ],
  'GG2': [
    {
      id: 2,
      group_id: 2,
      group_code: 'GG2',
      type: 'WARNING',
      message: 'Pressão do óleo abaixo do ideal',
      parameter: 'oil_pressure',
      value: 3.2,
      threshold: 3.5,
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      resolved_at: null,
      acknowledged_by: null
    }
  ]
};

export default function GroupAlertsPage() {
  const params = useParams();
  const code = params.code as string;
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      try {
        setLoading(true);
        // Usar MOCK por enquanto
        setTimeout(() => {
          setAlerts(MOCK_ALERTS_BY_GROUP[code] || []);
          setLoading(false);
        }, 500);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }

    if (code) {
      loadAlerts();
    }
  }, [code]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando alertas...</div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Nenhum alerta registrado para {code}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Alertas - {code}</h2>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            className={`bg-white rounded-lg shadow border-l-4 ${
              alert.type === 'CRITICAL' ? 'border-red-500' :
              alert.type === 'WARNING' ? 'border-yellow-500' :
              'border-blue-500'
            } p-4`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    alert.type === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    alert.type === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(alert.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-900">{alert.message}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Valor: {alert.value} | Limite: {alert.threshold}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                alert.status === 'ACTIVE' ? 'bg-red-100 text-red-800' :
                alert.status === 'ACKNOWLEDGED' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {alert.status}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link 
          href="/alerts"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Ver todos os alertas →
        </Link>
      </div>
    </div>
  );
}