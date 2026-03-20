import React, { useState, useEffect } from 'react';
import { Reservation, EQUIPMENT_TYPES } from '../types';
import { formatDate } from '../utils/dateHelpers';
import { supabaseService } from '../services/supabaseService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AdminChart } from './ui/AdminChart';

interface Props {
  reservations: Reservation[];
  onDelete: (id: number | string) => Promise<void>;
  onUpdate: (id: number | string, updates: Partial<Reservation>) => Promise<void>;
  onLogout: () => void;
}

interface GroupedReservation extends Reservation {
  items: { id: number | string; type: string }[];
}

type Tab = 'reservations' | 'professors';

const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: string; }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex items-center">
      <div className="mr-4 text-2xl bg-indigo-100 dark:bg-indigo-900/50 text-primary dark:text-indigo-300 p-2 rounded-lg">{icon}</div>
      <div>
        <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</div>
        <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</div>
      </div>
    </div>
  </div>
);

const getEquipmentMeta = (type: string) => {
  return EQUIPMENT_TYPES.find(e => e.id === type || e.label === type) || {
    id: type,
    label: type,
    color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
    icon: '📦'
  };
};


const AdminDashboard: React.FC<Props> = ({ reservations, onDelete, onUpdate, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('reservations');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // New state for dashboard-specific stats
  const [stats, setStats] = useState<{ usersCount: number; reservationsCount: number; monthlyReservations: any[] } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Edit reservation state
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editForm, setEditForm] = useState<Partial<Reservation>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Professors state
  const [professors, setProfessors] = useState<any[]>([]);
  const [loadingProfessors, setLoadingProfessors] = useState(false);
  const [showAddProfessor, setShowAddProfessor] = useState(false);
  const [newProf, setNewProf] = useState({ name: '', email: '', password: '' });
  const [profError, setProfError] = useState('');
  const [profLoading, setProfLoading] = useState(false);
  const [deletingProfId, setDeletingProfId] = useState<string | null>(null);

  // Load professors when tab is opened
  useEffect(() => {
    if (activeTab === 'professors') loadProfessors();
  }, [activeTab]);

  // Load dashboard stats on component mount
  useEffect(() => {
    setLoadingStats(true);
    setStatsError(null);
    supabaseService.getAdminDashboardStats()
      .then(data => setStats(data))
      .catch((err: any) => {
        console.error("Failed to load admin stats", err);
        setStatsError(err.message || 'Não foi possível carregar as estatísticas.');
      })
      .finally(() => setLoadingStats(false));
  }, []);

  const loadProfessors = async () => {
    setLoadingProfessors(true);
    try {
      const data = await supabaseService.getProfessors();
      setProfessors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProfessors(false);
    }
  };

  // Group reservations by session
  const groupedReservations = Object.values(
    reservations.reduce((acc, curr) => {
      const key = `${curr.date}|${curr.start_time}|${curr.end_time}|${curr.professor_name}`;
      const equipType = typeof curr.equipment_type === 'object' ? curr.equipment_type.value : curr.equipment_type;
      if (!acc[key]) acc[key] = { ...curr, items: [] };
      acc[key].items.push({ id: curr.id, type: equipType });
      return acc;
    }, {} as Record<string, GroupedReservation>)
  ) as GroupedReservation[];

  const filteredReservations = groupedReservations
    .filter(r =>
      r.professor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const d = b.date.localeCompare(a.date);
      if (d !== 0) return d;
      return a.start_time.localeCompare(b.start_time);
    });

  const handleDeleteGroup = async (items: { id: number | string }[]) => {
    if (!window.confirm(`Excluir esta reserva e liberar ${items.length} equipamento(s)?`)) return;
    setIsDeleting(true);
    try {
      await Promise.all(items.map(item => onDelete(item.id)));
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (res: GroupedReservation) => {
    setEditingReservation(res);
    setEditForm({
      professor_name: res.professor_name,
      date: res.date,
      start_time: res.start_time,
      end_time: res.end_time,
      subject: res.subject || '',
      class_name: res.class_name || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingReservation) return;
    setIsSaving(true);
    try {
      // Update all items in the group
      await Promise.all(
        (editingReservation as GroupedReservation).items.map(item =>
          onUpdate(item.id, editForm)
        )
      );
      setEditingReservation(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProfessor = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfError('');
    setProfLoading(true);
    try {
      await supabaseService.createProfessor(newProf.email, newProf.password, newProf.name);
      setNewProf({ name: '', email: '', password: '' });
      setShowAddProfessor(false);
      await loadProfessors();
      // Refetch stats to update user count
      supabaseService.getAdminDashboardStats().then(setStats);
    } catch (err: any) {
      setProfError(err.message || 'Erro ao criar professor');
    } finally {
      setProfLoading(false);
    }
  };

  const handleDeleteProfessor = async (userId: string, name: string) => {
    if (!window.confirm(`Remover o professor "${name}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingProfId(userId);
    try {
      await supabaseService.deleteProfessor(userId);
      await loadProfessors();
       // Refetch stats to update user count
      supabaseService.getAdminDashboardStats().then(setStats);
    } finally {
      setDeletingProfId(null);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(18); doc.setTextColor(79, 70, 229); doc.setFont('helvetica', 'bold');
      doc.text('Escola Modelo de Conceição', 14, 20);
      doc.setFontSize(11); doc.setTextColor(75, 85, 99); doc.setFont('helvetica', 'normal');
      doc.text('Ano Letivo: 2026', 14, 27);
      doc.text('Coordenadora: Samila Porto', 14, 33);
      doc.setDrawColor(229, 231, 235); doc.line(14, 38, 196, 38);
      doc.setFontSize(14); doc.setTextColor(17, 24, 39); doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Reservas - Team-Up', 14, 48);
      doc.setFontSize(9); doc.setTextColor(107, 114, 128); doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')} | Total: ${filteredReservations.length}`, 14, 54);

      const tableRows = filteredReservations.map(res => {
        const equipNames = res.items.map(item =>
          EQUIPMENT_TYPES.find(e => e.id === item.type)?.label || item.type
        ).join(', ');
        return [
          formatDate(res.date),
          `${res.start_time} - ${res.end_time}`,
          res.professor_name,
          equipNames,
          `${res.subject || '-'} ${res.class_name ? '(' + res.class_name + ')' : ''}`
        ];
      });

      autoTable(doc, {
        head: [['Data', 'Horário', 'Professor', 'Equipamentos', 'Disciplina/Turma']],
        body: tableRows,
        startY: 60,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      doc.save(`reservas_teamup_${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };
  
  const popularEquipment = reservations.reduce((acc, curr) => {
    const eq = typeof curr.equipment_type === 'object' ? curr.equipment_type.value : curr.equipment_type;
    acc[eq] = (acc[eq] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const equipmentStats = (Object.entries(popularEquipment) as [string, number][]).sort((a, b) => b[1] - a[1]);
  const maxUsage = equipmentStats[0]?.[1] || 1;


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Painel da Coordenação</h2>
        <button onClick={onLogout} className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 transition text-sm font-medium">
          Sair
        </button>
      </div>

      {/* Loading and Error States */}
      {loadingStats && (
        <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="font-medium text-gray-700 dark:text-gray-300">Carregando estatísticas...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Buscando dados do painel de admin.</p>
        </div>
      )}

      {statsError && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center border border-red-200 dark:border-red-800">
          <h3 className="font-bold text-lg text-red-800 dark:text-red-300">⚠️ Erro ao Carregar Painel</h3>
          <p className="text-red-700 dark:text-red-400 mt-1 mb-3 text-sm">{statsError}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Isso pode indicar um problema com as funções do banco de dados (RPCs) ou permissões.
            Verifique o console do navegador para mais detalhes e se as funções <code>get_total_users_count</code>, <code>get_total_reservations_count</code>, e <code>get_monthly_reservations_count</code> estão implantadas corretamente no Supabase.
          </p>
        </div>
      )}

      {/* Main Dashboard Content - Renders only if no error and not loading */}
      {!loadingStats && !statsError && stats && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total de Reservas" value={stats.reservationsCount} icon="📅" />
            <StatCard title="Total de Professores" value={stats.usersCount} icon="👩‍🏫" />
            <div onClick={handleExportPDF} className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition active:scale-95 ${isExporting ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="text-center">
                <span className="text-2xl">{isExporting ? '⏳' : '📄'}</span>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">{isExporting ? 'Gerando...' : 'Exportar PDF'}</div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Equipamento Mais Popular</div>
              <div className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate">{equipmentStats[0]?.[0] || '-'}</div>
            </div>
          </div>
          
          {/* Chart */}
          {stats.monthlyReservations && stats.monthlyReservations.length > 0 && (
            <AdminChart data={stats.monthlyReservations} />
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('reservations')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'reservations' ? 'bg-white dark:bg-gray-700 shadow text-primary dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              📅 Reservas
            </button>
            <button
              onClick={() => setActiveTab('professors')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'professors' ? 'bg-white dark:bg-gray-700 shadow text-primary dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              👩‍🏫 Professores
            </button>
          </div>

          {/* RESERVATIONS TAB */}
          {activeTab === 'reservations' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats sidebar */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Uso por Equipamento</h3>
                <div className="space-y-4">
                  {equipmentStats.map(([name, count]) => (
                    <div key={name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-300">{name}</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{count}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-primary dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(count / maxUsage) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                  {equipmentStats.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Sem dados.</p>}
                </div>
              </div>

              {/* Table */}
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
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Horário</th>
                        <th className="px-4 py-3">Professor / Disciplina</th>
                        <th className="px-4 py-3 text-center">Equipamentos</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredReservations.map(res => (
                        <tr key={`${res.date}-${res.start_time}-${res.professor_name}`} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                          <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">{formatDate(res.date)}</td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800 dark:text-gray-200">{res.start_time} - {res.end_time}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 dark:text-white">{res.professor_name}</div>
                            {(res.subject || res.class_name) && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{res.subject} {res.class_name ? `• ${res.class_name}` : ''}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5 justify-center flex-wrap">
                              {res.items.map(item => {
                                const meta = getEquipmentMeta(item.type);
                                return (
                                  <div key={String(item.id)} title={meta.label} className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-sm border border-black/5 dark:border-white/10 ${meta.color} cursor-help transition hover:scale-110`}>
                                    {meta.icon}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => openEdit(res)}
                                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs px-2 py-1.5 rounded border border-blue-100 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(res.items)}
                                disabled={isDeleting}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 text-xs px-2 py-1.5 rounded border border-red-100 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 transition disabled:opacity-50"
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredReservations.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nenhuma reserva encontrada.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PROFESSORS TAB */}
          {activeTab === 'professors' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">Professores Cadastrados</h3>
                <button
                  onClick={() => { setShowAddProfessor(true); setProfError(''); }}
                  className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  + Novo Professor
                </button>
              </div>

              {/* Add professor form */}
              {showAddProfessor && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Cadastrar Novo Professor</h4>
                  <form onSubmit={handleAddProfessor} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      required
                      type="text"
                      placeholder="Nome completo"
                      value={newProf.name}
                      onChange={e => setNewProf(p => ({ ...p, name: e.target.value }))}
                      className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <input
                      required
                      type="email"
                      placeholder="Email"
                      value={newProf.email}
                      onChange={e => setNewProf(p => ({ ...p, email: e.target.value }))}
                      className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <input
                      required
                      type="password"
                      placeholder="Senha inicial"
                      minLength={6}
                      value={newProf.password}
                      onChange={e => setNewProf(p => ({ ...p, password: e.target.value }))}
                      className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    {profError && <p className="sm:col-span-3 text-red-500 text-sm">{profError}</p>}
                    <div className="sm:col-span-3 flex gap-2 justify-end">
                      <button type="button" onClick={() => setShowAddProfessor(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300 transition">Cancelar</button>
                      <button type="submit" disabled={profLoading} className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium">
                        {profLoading ? 'Salvando...' : 'Cadastrar'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Professors list */}
              {loadingProfessors ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {professors.map(prof => (
                    <div key={prof.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{prof.user_metadata?.name || '—'}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{prof.email}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${prof.user_metadata?.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}>
                          {prof.user_metadata?.role === 'admin' ? '👑 Admin' : '👨‍🏫 Professor'}
                        </span>
                        {prof.user_metadata?.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteProfessor(prof.id, prof.user_metadata?.name || prof.email)}
                            disabled={deletingProfId === prof.id}
                            className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-100 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 transition disabled:opacity-50"
                          >
                            {deletingProfId === prof.id ? '...' : 'Remover'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {professors.length === 0 && (
                    <p className="text-center text-gray-400 py-8">Nenhum professor cadastrado.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* EDIT MODAL */}
      {editingReservation && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Editar Reserva</h3>
                <button onClick={() => setEditingReservation(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none">&times;</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Professor</label>
                  <input
                    type="text"
                    value={editForm.professor_name || ''}
                    onChange={e => setEditForm(f => ({ ...f, professor_name: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                  <input
                    type="date"
                    value={editForm.date || ''}
                    onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Início</label>
                    <input
                      type="time"
                      value={editForm.start_time || ''}
                      onChange={e => setEditForm(f => ({ ...f, start_time: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fim</label>
                    <input
                      type="time"
                      value={editForm.end_time || ''}
                      onChange={e => setEditForm(f => ({ ...f, end_time: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Disciplina</label>
                    <input
                      type="text"
                      value={editForm.subject || ''}
                      onChange={e => setEditForm(f => ({ ...f, subject: e.target.value }))}
                      placeholder="Matemática"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Turma</label>
                    <input
                      type="text"
                      value={editForm.class_name || ''}
                      onChange={e => setEditForm(f => ({ ...f, class_name: e.target.value }))}
                      placeholder="3º A"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setEditingReservation(null)} className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 transition">
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
