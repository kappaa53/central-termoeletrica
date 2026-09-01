'use client';

import { Group } from '@/app/services/api';

interface GroupCardProps {
  group: Group;
}

const statusColors: Record<string, string> = {
  'Em operação': 'bg-green-100 text-green-800 border-green-300',
  'Parado': 'bg-gray-100 text-gray-800 border-gray-300',
  'Manutenção': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Alerta': 'bg-red-100 text-red-800 border-red-300',
};

export function GroupCard({ group }: GroupCardProps) {
  const statusColor = statusColors[group.status] || 'bg-gray-100 text-gray-800';

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 cursor-pointer border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold text-gray-900">{group.code}</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColor}`}>
          {group.status}
        </span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Fabricante:</span>
          <span className="font-medium text-gray-900">{group.manufacturer}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Potência:</span>
          <span className="font-medium text-gray-900">{group.nominal_power_mw} MW</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Cilindros:</span>
          <span className="font-medium text-gray-900">{group.cylinders}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Configuração:</span>
          <span className="font-medium text-gray-900">{group.cylinder_configuration}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <span className="text-blue-600 text-sm font-medium hover:text-blue-800">
          Ver detalhes →
        </span>
      </div>
    </div>
  );
}