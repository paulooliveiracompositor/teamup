import { format, parse, isSameDay, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatDate = (date: Date | string, formatStr: string = 'dd/MM/yyyy'): string => {
  const d = typeof date === 'string' ? parse(date, 'yyyy-MM-dd', new Date()) : date;
  return format(d, formatStr, { locale: ptBR });
};

export const getDaysInMonth = (currentDate: Date) => {
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  return eachDayOfInterval({ start, end });
};

export const getDaysInWeek = (currentDate: Date) => {
  const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday start
  const end = endOfWeek(currentDate, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
};

export const isTimeOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  // Simple string comparison works for HH:MM format 24h
  return (start1 < end2 && start2 < end1);
};