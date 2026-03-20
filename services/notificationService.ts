import { Reservation, EQUIPMENT_TYPES } from '../types';

export const notificationService = {
  // Request permission from the user
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn("Este navegador não suporta notificações.");
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      return false;
    }
  },

  // Check current permission state
  getPermissionState(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  },

  // Check for reservations tomorrow for the stored user
  async checkAndNotify(reservations: Reservation[]) {
    // 1. Check permissions
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    // 2. Identify the user (stored when they make a reservation)
    const myName = localStorage.getItem('lastProfessorName');
    if (!myName) return;

    // 3. Calculate "Tomorrow" date string (YYYY-MM-DD)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // 4. Filter reservations for tomorrow matching the user name
    const myReservations = reservations.filter(r => 
      r.professor_name.toLowerCase().trim() === myName.toLowerCase().trim() &&
      r.date === tomorrowStr
    );

    if (myReservations.length === 0) return;

    // 5. Spam prevention: Track notified Reservation IDs instead of just "last checked date"
    // This allows notifying about NEW reservations made for tomorrow, while ignoring ones we already alerted about.
    const notifiedIds: (number | string)[] = JSON.parse(localStorage.getItem('teamup_notified_ids') || '[]');
    
    // Filter only those that haven't been notified yet
    const newReservations = myReservations.filter(r => !notifiedIds.includes(r.id));

    if (newReservations.length === 0) return;

    // 6. Construct Message
    const title = 'Lembrete Team-Up 📅';
    let body = '';
    const firstName = myName.split(' ')[0];

    if (newReservations.length === 1) {
      const res = newReservations[0];
      const eqValue = typeof res.equipment_type === 'object' ? res.equipment_type.value : res.equipment_type;
      const eqLabel = EQUIPMENT_TYPES.find(e => e.id === eqValue)?.label || eqValue;
      body = `Olá ${firstName}, lembre-se da sua reserva de ${eqLabel} amanhã às ${res.start_time}.`;
    } else {
      body = `Olá ${firstName}, você tem ${newReservations.length} novas reservas confirmadas para amanhã.`;
    }

    // 7. Send Notification
    try {
      const iconUrl = 'https://picsum.photos/192/192'; 

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.showNotification) {
            await registration.showNotification(title, {
                body,
                icon: iconUrl,
                badge: iconUrl,
                vibrate: [200, 100, 200],
                tag: 'reservation-reminder', // Replaces old notification with same tag
                data: { date: tomorrowStr, url: '/' },
                requireInteraction: true
            } as any);
        } else {
            new Notification(title, { body, icon: iconUrl });
        }
      } else {
        new Notification(title, {
          body,
          icon: iconUrl
        });
      }

      // 8. Update stored IDs
      // Keep list from growing indefinitely by only keeping recent ones (optional, but good practice)
      // For simplicity, we just append new ones. 
      const updatedIds = [...notifiedIds, ...newReservations.map(r => r.id)];
      localStorage.setItem('teamup_notified_ids', JSON.stringify(updatedIds));
      
    } catch (e) {
      console.error("Failed to show notification", e);
    }
  }
};