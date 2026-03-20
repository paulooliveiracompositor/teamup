import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '../services/supabaseService';
import { Reservation } from '../types';

export const RESERVATIONS_QUERY_KEY = ['reservations'];

export const useReservations = () => {
  return useQuery({
    queryKey: RESERVATIONS_QUERY_KEY,
    queryFn: supabaseService.getReservations.bind(supabaseService),
  });
};

export const useCreateReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newReservation: Partial<Reservation>) =>
      supabaseService.createReservation(newReservation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_QUERY_KEY });
    },
  });
};

export const useDeleteReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => supabaseService.deleteReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_QUERY_KEY });
    },
  });
};