import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payloadService } from '../services/payloadService';
import { Reservation } from '../types';

// Key for caching
export const RESERVATIONS_QUERY_KEY = ['reservations'];

export const useReservations = () => {
  return useQuery({
    queryKey: RESERVATIONS_QUERY_KEY,
    queryFn: payloadService.getReservations.bind(payloadService),
  });
};

export const useCreateReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newReservation: Partial<Reservation>) => payloadService.createReservation(newReservation),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_QUERY_KEY });
    },
  });
};

export const useDeleteReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => payloadService.deleteReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_QUERY_KEY });
    },
  });
};