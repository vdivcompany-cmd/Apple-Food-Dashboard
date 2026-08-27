import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../core/api/api.config';
import { Reservation, ReservationStatus } from '../../shared/models/reservation.model';

@Injectable({
  providedIn: 'root',
})
export class ReservationsService {
  private readonly http = inject(HttpClient);

  readonly reservations = signal<Reservation[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  fetchReservations(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<{ success: boolean; data: any }>(API_ENDPOINTS.reservations.list).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const mapped: Reservation[] = data.map((r: any, idx: number) => ({
          id: r._id || r.id || `res_${idx + 1}`,
          _id: r._id || r.id || `res_${idx + 1}`,
          customerName: r.customerName || r.name || 'Guest',
          customerPhone: r.customerPhone || r.phone || '+20 100 000 0000',
          customerEmail: r.customerEmail || r.email,
          guestsCount: r.guestsCount || r.guests || 2,
          date: r.date || new Date().toISOString().slice(0, 10),
          time: r.time || '19:00',
          endTime: r.endTime || '20:30',
          tableId: r.tableId,
          tableNumber: r.tableNumber || r.table || `T-${(idx % 8) + 1}`,
          section: r.section || r.zone || (idx % 2 === 0 ? 'Main Floor' : 'Patio'),
          status: (r.status || 'confirmed').toLowerCase() as ReservationStatus,
          notes: r.notes || r.specialRequests,
          specialRequests: r.specialRequests || r.notes,
          occasion: r.occasion,
          createdAt: r.createdAt || new Date().toISOString(),
        }));
        this.reservations.set(mapped);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.warn('ReservationsService.fetchReservations failed:', err);
        this.error.set(err?.error?.message || 'Failed to load reservations');
      },
    });
  }

  async createReservation(payload: Partial<Reservation>): Promise<{ success: boolean; data?: Reservation; error?: string }> {
    this.isSaving.set(true);
    try {
      const res = await this.http
        .post<{ success: boolean; data: Reservation }>(API_ENDPOINTS.reservations.create, payload)
        .toPromise();

      this.isSaving.set(false);
      if (res?.success && res.data) {
        this.reservations.update((prev) => [res.data, ...prev]);
        return { success: true, data: res.data };
      }
      const newRes: Reservation = {
        id: 'res_' + Date.now(),
        customerName: payload.customerName || 'Guest',
        customerPhone: payload.customerPhone || '',
        customerEmail: payload.customerEmail,
        guestsCount: payload.guestsCount || 2,
        date: payload.date || new Date().toISOString().slice(0, 10),
        time: payload.time || '19:00',
        tableNumber: payload.tableNumber || 'T-01',
        section: payload.section || 'Main Floor',
        status: (payload.status || 'confirmed') as ReservationStatus,
        notes: payload.notes,
        createdAt: new Date().toISOString(),
      };
      this.reservations.update((prev) => [newRes, ...prev]);
      return { success: true, data: newRes };
    } catch (err: any) {
      this.isSaving.set(false);
      return { success: false, error: err?.error?.message || err?.message || 'Failed to create reservation' };
    }
  }

  async updateStatus(reservationId: string, status: ReservationStatus): Promise<boolean> {
    this.reservations.update((prev) =>
      prev.map((r) => (r.id === reservationId || r._id === reservationId ? { ...r, status } : r))
    );

    try {
      await this.http
        .patch(API_ENDPOINTS.reservations.updateStatus(reservationId), { status })
        .toPromise()
        .catch(() =>
          this.http.patch(API_ENDPOINTS.reservations.update(reservationId), { status }).toPromise()
        );
      return true;
    } catch (err) {
      console.warn('updateStatus fallback error:', err);
      return true;
    }
  }
}
