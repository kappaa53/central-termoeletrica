
'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  ImportBatch, 
  ImportError,
  getImportBatches, 
  getImportErrors,
  uploadFile 
} from '@/app/services/api';
import {
  DocumentArrowUpIcon,
  DocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const getStatusColor = (status: ImportBatch['status']) => {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800';
    case 'PROCESSING': return 'bg-blue-100 text-blue-800';
    case 'COMPLETED': return 'bg-green-100 text-green-800';
    case 'FAILED': return 'bg-red-100 text-red-800';
  }
};

const getStatusIcon = (status: ImportBatch['status']) => {
  switch (status) {
    case 'PENDING': return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    case 'PROCESSING': return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
    case 'COMPLETED': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'FAILED': return <XCircleIcon className="h-5 w-5 text-red-500" />;
  }
};

const getStatusText = (status: ImportBatch['status']) => {
  switch (status) {
    case 'PENDING': return 'Pendente';
    case 'PROCESSING': return 'Processando';
    case 'COMPLETED': return 'Concluído';
    case 'FAILED': return 'Falhou';
  }
};

const getFileTypeIcon = () => {
  return <DocumentIcon className="h-5 w-5 text-gray-400" />;
};

export default function ImportsPage() {
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ImportBatch | null>(null);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBatches = async () => {
    try {
      const data = await getImportBatches();
      setBatches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getImportBatches()
      .then(setBatches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      await uploadFile(file);
      await loadBatches();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      handleFileUpload(file);
    } else {
      alert('Por favor, envie apenas arquivos Excel (.xlsx, .xls) ou CSV.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const viewErrors = async (batch: ImportBatch) => {
    setSelectedBatch(batch);
    try {
      const errorData = await getImportErrors(batch.id);
      setErrors(errorData);
      setShowErrors(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando importações...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Importação de Dados</h1>

      {/* Área de Upload */}
      <div className="mb-6">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 bg-white hover:border-blue-400'
          }`}
        >
          <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            Arraste e solte seu arquivo aqui ou 
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-800 font-medium ml-1"
            >
              clique para selecionar
            </button>
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Formatos suportados: .xlsx, .xls, .csv
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        {uploading && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />
              <span className="text-blue-700">Enviando arquivo...</span>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Importações */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Histórico de Importações</h2>
          <span className="text-sm text-gray-500">{batches.length} importações</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arquivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Linhas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sucesso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Erros
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma importação realizada ainda
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getFileTypeIcon()}
                        <span className="text-sm font-medium text-gray-900">
                          {batch.filename}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(batch.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                          {getStatusText(batch.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {batch.total_rows}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {batch.successful_rows}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {batch.error_rows}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(batch.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {batch.error_rows > 0 && (
                        <button
                          onClick={() => viewErrors(batch)}
                          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          <EyeIcon className="h-4 w-4" />
                          <span>Ver erros</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Erros */}
      {showErrors && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Erros de Importação
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedBatch.filename} • {errors.length} erros encontrados
                </p>
              </div>
              <button
                onClick={() => setShowErrors(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {errors.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum erro encontrado
                </p>
              ) : (
                <div className="space-y-3">
                  {errors.map((error) => (
                    <div key={error.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <XCircleIcon className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium text-red-700">
                              Linha {error.row_number}
                            </span>
                            {error.column && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                {error.column}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-red-700">{error.error_message}</p>
                          {error.raw_data && (
                            <div className="mt-1 text-xs text-red-600 bg-red-100 p-1 rounded">
                              Dados: {error.raw_data}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowErrors(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}