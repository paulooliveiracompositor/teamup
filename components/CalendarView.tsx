import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Reservation, EQUIPMENT_TYPES } from '../types';

interface Props {
  reservations: Reservation[];
  onSelectDate: (date: Date) => void;
  onSelectReservation: (res: Reservation) => void;
}

const CalendarView: React.FC<Props> = ({ reservations, onSelectDate, onSelectReservation }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // State for Tooltip: stores reservation data and position coordinates
  const [hoveredInfo, setHoveredInfo] = useState<{ res: Reservation; x: number; y: number } | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDaysHeader = eachDayOfInterval({ start: startDate, end: addDays(startDate, 6) });

  const getReservationsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return reservations.filter(r => r.date === dateStr).sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const getEquipmentColor = (type: string | { value: string }) => {
    const typeStr = typeof type === 'object' ? type.value : type;
    const eq = EQUIPMENT_TYPES.find(e => e.id === typeStr);
    return eq ? eq.color : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const getEquipmentLabel = (type: string | { value: string }) => {
    const typeStr = typeof type === 'object' ? type.value : type;
    return EQUIPMENT_TYPES.find(e => e.id === typeStr)?.label || typeStr;
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full transition-colors relative">
      {/* Calendar Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        
        <h2 className="text-lg font-bold text-gray-800 dark:text-white capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        
        <button onClick={nextMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
        {weekDaysHeader.map((day) => (
          <div key={day.toString()} className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {format(day, 'EEE', { locale: ptBR })}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 dark:bg-gray-700 gap-px border-b border-gray-200 dark:border-gray-700">
        {calendarDays.map((day, idx) => {
           const isCurrentMonth = isSameMonth(day, monthStart);
           const isToday = isSameDay(day, new Date());
           const dayRes = getReservationsForDay(day);
           
           return (
             <div 
               key={day.toString()} 
               className={`min-h-[100px] md:min-h-[120px] bg-white dark:bg-gray-800 relative group transition hover:bg-gray-50 dark:hover:bg-gray-700 flex flex-col ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-900/50' : ''}`}
               onClick={(e) => {
                 if (e.target === e.currentTarget) {
                    onSelectDate(day);
                 }
               }}
             >
               <div className={`p-1 text-right text-sm font-medium ${isToday ? 'text-primary dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'} ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : ''}`}>
                 <span className={`${isToday ? 'bg-blue-100 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded-full' : ''}`}>
                   {format(day, 'd')}
                 </span>
               </div>
               
               <div className="flex-1 px-1 pb-1 space-y-1 overflow-y-auto no-scrollbar">
                 {dayRes.map(res => {
                    const eqType = typeof res.equipment_type === 'object' ? res.equipment_type.value : res.equipment_type;
                    const eqObj = EQUIPMENT_TYPES.find(e => e.id === eqType);
                    
                    return (
                     <div 
                       key={res.id}
                       onClick={(e) => {
                         e.stopPropagation();
                         onSelectReservation(res);
                       }}
                       onMouseEnter={(e) => {
                         const rect = e.currentTarget.getBoundingClientRect();
                         setHoveredInfo({ res, x: rect.left, y: rect.top });
                       }}
                       onMouseLeave={() => setHoveredInfo(null)}
                       className={`px-1.5 py-1 rounded text-[10px] md:text-xs border cursor-pointer hover:opacity-80 transition truncate flex items-center gap-1 ${getEquipmentColor(res.equipment_type)}`}
                     >
                       <span className="hidden md:inline">{eqObj?.icon}</span>
                       <span className="font-bold">{res.start_time}</span>
                       <span className="truncate hidden sm:inline">- {res.professor_name}</span>
                     </div>
                   )
                 })}
                 
                 {dayRes.length > 3 && (
                   <div className="md:hidden text-center text-gray-400 dark:text-gray-500 text-[10px] leading-none">
                     + {dayRes.length - 3}
                   </div>
                 )}
               </div>

               {/* Add Button Overlay */}
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   onSelectDate(day);
                 }}
                 className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity font-medium text-primary dark:text-white text-sm"
               >
                 + Criar
               </button>
             </div>
           );
        })}
      </div>

      {/* Tooltip Portal/Overlay */}
      {hoveredInfo && (
        <div 
          className="fixed z-50 pointer-events-none hidden md:block animate-fade-in"
          style={{ 
            left: hoveredInfo.x, 
            top: hoveredInfo.y,
            transform: 'translateY(-100%)',
            marginTop: '-8px' // slight offset above element
          }}
        >
          <div className="bg-gray-900/95 dark:bg-black/95 text-white text-xs rounded-lg py-2 px-3 shadow-xl backdrop-blur-sm border border-gray-700 min-w-[200px] max-w-xs">
            <div className="font-bold text-secondary mb-1 flex justify-between items-center">
              <span>{getEquipmentLabel(hoveredInfo.res.equipment_type)}</span>
              <span className="text-[10px] bg-white/10 px-1.5 rounded">{hoveredInfo.res.start_time} - {hoveredInfo.res.end_time}</span>
            </div>
            <div className="space-y-0.5">
              <p><span className="text-gray-400">Prof:</span> {hoveredInfo.res.professor_name}</p>
              {hoveredInfo.res.subject && <p><span className="text-gray-400">Disc:</span> {hoveredInfo.res.subject}</p>}
              {hoveredInfo.res.class_name && <p><span className="text-gray-400">Turma:</span> {hoveredInfo.res.class_name}</p>}
            </div>
          </div>
          {/* Arrow down */}
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900/95 dark:border-t-black/95 mx-auto -mt-[1px]"></div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;