import React, { useState } from 'react';
import { Reservation, EQUIPMENT_TYPES } from '../types';
import { formatDate } from '../utils/dateHelpers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  reservations: Reservation[];
  onDelete: (id: number) => Promise<void>;
  onLogout: () => void;
}

// Interface for grouped reservations
interface GroupedReservation extends Reservation {
  items: { id: number; type: string }[];
}

const AdminDashboard: React.FC<Props> = ({ reservations, onDelete, onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // 1. Group reservations by unique session (Date + Time + Professor)
  const groupedReservations = Object.values(
    reservations.reduce((acc, curr) => {
      // Create a unique key for the session
      const key = `${curr.date}|${curr.start_time}|${curr.end_time}|${curr.professor_name}`;
      
      const equipType = typeof curr.equipment_type === 'object' ? curr.equipment_type.value : curr.equipment_type;

      if (!acc[key]) {
        acc[key] = {
          ...curr,
          items: [] // Initialize array to hold individual equipment IDs
        };
      }
      
      acc[key].items.push({
        id: curr.id,
        type: equipType
      });
      
      return acc;
    }, {} as Record<string, GroupedReservation>)
  ) as GroupedReservation[];

  // 2. Filter and Sort the GROUPED reservations
  const filteredReservations = groupedReservations
    .filter(r => 
      r.professor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Compare dates
      const dateComparison = b.date.localeCompare(a.date);
      if (dateComparison !== 0) return dateComparison;
      
      // Compare times
      const timeComparison = a.start_time.localeCompare(b.start_time);
      if (timeComparison !== 0) return timeComparison;

      // Compare names
      return a.professor_name.localeCompare(b.professor_name);
    });

  const handleDeleteGroup = async (items: { id: number }[]) => {
    if (window.confirm(`Tem certeza que deseja excluir esta reserva e liberar ${items.length} equipamento(s)?`)) {
      setIsDeleting(true);
      try {
        // Execute all deletes in parallel
        await Promise.all(items.map(item => onDelete(item.id)));
      } catch (error) {
        console.error("Error deleting group", error);
        alert("Erro ao excluir alguns itens.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      // --- HEADER ---
      
      // School Name (Primary Color, Bold, Large)
      doc.setFontSize(18);
      doc.setTextColor(79, 70, 229); // #4F46E5
      doc.setFont("helvetica", "bold");
      doc.text("Escola Modelo de Conceição", 14, 20);
      
      // School Year & Coordinator (Dark Gray, Normal, Medium)
      doc.setFontSize(11);
      doc.setTextColor(75, 85, 99); // Gray-600
      doc.setFont("helvetica", "normal");
      doc.text("Ano Letivo: 2026", 14, 27);
      doc.text("Coordenadora: Samila Porto", 14, 33);

      // Separator Line
      doc.setDrawColor(229, 231, 235); // Gray-200
      doc.line(14, 38, 196, 38);

      // Report Title (Black, Bold)
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39); // Gray-900
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Reservas - Team-Up", 14, 48);
      
      // Metadata (Light Gray, Small)
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128); // Gray-500
      doc.setFont("helvetica", "normal");
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')} | Total de registros: ${filteredReservations.length}`, 14, 54);

      // --- DATA TABLE ---

      const tableRows = filteredReservations.map(res => {
        // Create a string list of equipments (e.g. "TV, Datashow")
        const equipNames = res.items.map(item => {
           const label = EQUIPMENT_TYPES.find(e => e.id === item.type)?.label || item.type;
           return label;
        }).join(', ');

        return [
          formatDate(res.date),
          `${res.start_time} - ${res.end_time}`,
          res.professor_name,
          equipNames,
          `${res.subject || '-'} ${res.class_name ? '(' + res.class_name + ')' : ''}`
        ];
      });

      // Generate Table
      autoTable(doc, {
        head: [['Data', 'Horário', 'Professor', 'Equipamentos', 'Disciplina/Turma']],
        body: tableRows,
        startY: 60, // Moved down to accommodate larger header
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      // Download
      const fileName = `reservas_teamup_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Erro ao gerar PDF", error);
      alert("Erro ao gerar o PDF. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  const totalReservations = reservations.length;
  
  // Calculate stats based on raw reservations
  const popularEquipment = reservations.reduce((acc, curr) => {
    const eq = typeof curr.equipment_type === 'object' ? curr.equipment_type.value : curr.equipment_type;
    acc[eq] = (acc[eq] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const equipmentStats = (Object.entries(popularEquipment) as [string, number][])
    .sort((a, b) => b[1] - a[1]);
    
  const mostUsedEq = equipmentStats.length > 0 ? equipmentStats[0] : null;
  const maxUsage = equipmentStats.length > 0 ? equipmentStats[0][1] : 1;

  // Helper to get icon and color
  const getEquipmentMeta = (type: string) => {
    return EQUIPMENT_TYPES.find(e => e.id === type) || { icon: '❓', color: 'bg-gray-100', label: type };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Painel Administrativo</h2>
        <button 
          onClick={onLogout} 
          className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition text-sm font-medium"
        >
          Sair
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-gray-500 dark:text-gray-400 text-sm">Total de Reservas</div>
          <div className="text-3xl font-bold text-primary dark:text-indigo-400">{totalReservations}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-gray-500 dark:text-gray-400 text-sm">Equipamento Favorito</div>
          <div className="text-xl font-bold text-secondary dark:text-emerald-400 truncate">{mostUsedEq ? mostUsedEq[0] : '-'}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">{mostUsedEq ? `${mostUsedEq[1]} reservas` : ''}</div>
        </div>
        <div 
          onClick={handleExportPDF}
          className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition active:scale-95 ${isExporting ? 'opacity-50 pointer-events-none' : ''}`}
        >
           <div className="text-center">
             <span className="text-2xl">{isExporting ? '⏳' : '📄'}</span>
             <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">
               {isExporting ? 'Gerando...' : 'Exportar Relatório PDF'}
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Statistics Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Estatísticas de Uso</h3>
          <div className="space-y-4">
            {equipmentStats.map(([name, count]) => (
              <div key={name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-300">{name}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{count}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-primary dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${(count / maxUsage) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {equipmentStats.length === 0 && (
               <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">Sem dados de uso.</p>
            )}
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Todas as Reservas ({filteredReservations.length})</h3>
            <input 
              type="text" 
              placeholder="Buscar por professor ou disciplina..." 
              className="px-4 py-2 border rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                <tr>
                  <th className="px-4 py-3 w-32">Data</th>
                  <th className="px-4 py-3 w-28">Horário</th>
                  <th className="px-4 py-3">Professor / Disciplina</th>
                  <th className="px-4 py-3 text-center">Equipamentos</th>
                  <th className="px-4 py-3 text-right w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredReservations.map(res => {
                   return (
                    <tr key={`${res.date}-${res.start_time}-${res.professor_name}`} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">
                        {formatDate(res.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800 dark:text-gray-200">
                        {res.start_time} - {res.end_time}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{res.professor_name}</div>
                        {(res.subject || res.class_name) && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {res.subject} {res.class_name ? `• ${res.class_name}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 justify-center flex-wrap">
                          {res.items.map((item) => {
                            const meta = getEquipmentMeta(item.type);
                            return (
                              <div 
                                key={item.id} 
                                title={meta.label}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-sm border border-black/5 dark:border-white/10 ${meta.color} cursor-help transition hover:scale-110`}
                              >
                                {meta.icon}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => handleDeleteGroup(res.items)}
                          disabled={isDeleting}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium text-xs px-2 py-1.5 rounded border border-red-100 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 transition disabled:opacity-50"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                   );
                })}
                {filteredReservations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                      Nenhuma reserva encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;