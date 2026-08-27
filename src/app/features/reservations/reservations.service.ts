import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../core/api/api.config';
import { Reservation, ReservationStatus, CreateReservationDto } from '../../shared/models/reservation.model';
import { RestaurantTable } from '../../shared/models/table.model';
import { AuthService } from '../../core/auth/auth.service';

export function isValidEgyptianPhone(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  // Mobile numbers in Egypt: 010, 011, 012, 015 followed by 8 digits
  // With optional +20 or 20 or 0 prefix
  const egMobileRegex = /^(\+?20|0)?1[0125][0-9]{8}$/;
  // Landlines: Cairo/Giza (02), Alexandria (03), etc.
  const egLandlineRegex = /^(\+?20|0)?[23][0-9]{7,8}$/;
  // General Egyptian phone with 8-15 digits starting with +20 or 0
  const generalEgRegex = /^(\+?20|0)[0-9]{8,11}$/;
  return egMobileRegex.test(clean) || egLandlineRegex.test(clean) || generalEgRegex.test(clean);
}

export function formatEgyptianPhoneForBackend(phone: string): string {
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  if (clean.startsWith('+20')) {
    return clean;
  }
  if (clean.startsWith('20')) {
    return '+' + clean;
  }
  if (clean.startsWith('0')) {
    return '+20' + clean.slice(1);
  }
  return '+20' + clean;
}

@Injectable({
  providedIn: 'root',
})
export class ReservationsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  readonly reservations = signal<Reservation[]>([]);
  readonly tables = signal<RestaurantTable[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  fetchTables(): void {
    this.http.get<{ success: boolean; data: any }>(API_ENDPOINTS.tables.list).subscribe({
      next: (res) => {
        const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const mapped = raw.map((t: any) => ({
          _id: t._id || t.id,
          id: t._id || t.id,
          tableNumber: t.number || t.tableNumber || 1,
          capacity: t.capacity || 4,
          section: t.section || t.zone || 'Main Dining',
          status: t.status || 'AVAILABLE',
        }));
        this.tables.set(mapped);
      },
      error: (err) => console.warn('ReservationsService.fetchTables error:', err),
    });
  }

  fetchReservations(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<{ success: boolean; data: any }>(API_ENDPOINTS.reservations.list).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const currentTables = this.tables();

        const mapped: Reservation[] = data.map((r: any, idx: number) => {
          let dateStr = new Date().toISOString().slice(0, 10);
          let timeStr = '19:00';
          let endTimeStr = '20:30';

          if (r.reservedFor) {
            try {
              const d = new Date(r.reservedFor);
              dateStr = d.toISOString().slice(0, 10);
              const hours = String(d.getHours()).padStart(2, '0');
              const mins = String(d.getMinutes()).padStart(2, '0');
              timeStr = `${hours}:${mins}`;

              const endD = new Date(d.getTime() + 90 * 60 * 1000);
              const endHours = String(endD.getHours()).padStart(2, '0');
              const endMins = String(endD.getMinutes()).padStart(2, '0');
              endTimeStr = `${endHours}:${endMins}`;
            } catch (err) {
              console.warn('Error parsing reservedFor date:', err);
            }
          }

          // Match real table designation if tableId exists
          let assignedTableNumber: string | number = r.tableNumber || `Table #${(idx % 8) + 1}`;
          let assignedSection = r.section || r.zone || 'Main Dining';

          if (r.tableId) {
            const foundTable = currentTables.find((t) => (t._id || t.id) === r.tableId);
            if (foundTable) {
              assignedTableNumber = `Table ${foundTable.tableNumber}`;
              assignedSection = foundTable.section || 'Main Dining';
            }
          }

          const rawStatus = (r.status || 'PENDING').toUpperCase();
          const normalizedStatus = (rawStatus === 'CONFIRMED'
            ? 'confirmed'
            : rawStatus === 'SEATED'
            ? 'seated'
            : rawStatus === 'CANCELLED'
            ? 'cancelled'
            : rawStatus === 'NO_SHOW'
            ? 'no_show'
            : 'pending') as ReservationStatus;

          return {
            id: r._id || r.id || `res_${idx + 1}`,
            _id: r._id || r.id || `res_${idx + 1}`,
            tenantId: r.tenantId,
            branchId: r.branchId,
            customerName: r.customerName || r.name || 'Guest',
            customerPhone: r.customerPhone || r.phone || '+20 100 000 0000',
            customerEmail: r.customerEmail || r.email,
            partySize: r.partySize || r.guestsCount || 2,
            guestsCount: r.partySize || r.guestsCount || 2,
            reservedFor: r.reservedFor,
            date: dateStr,
            time: timeStr,
            endTime: endTimeStr,
            tableId: r.tableId,
            tableNumber: assignedTableNumber,
            section: assignedSection,
            channel: r.channel || 'DASHBOARD',
            status: normalizedStatus,
            notes: r.notes || r.specialRequests,
            specialRequests: r.specialRequests || r.notes,
            occasion: r.occasion,
            createdAt: r.createdAt || new Date().toISOString(),
          };
        });
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

    const tenantId = this.authService.tenantId() || '6a85e588d0b508058fc5008c';
    const branchId = this.authService.branchId() || '6a8ff948dd0a4e3e0142a655';

    // 1. Phone validation
    const rawPhone = (payload.customerPhone || '').trim();
    if (!isValidEgyptianPhone(rawPhone)) {
      this.isSaving.set(false);
      return {
        success: false,
        error: 'Invalid Egyptian phone number. Please enter an 11-digit mobile number (e.g. 01012345678, 011..., 012..., 015...).',
      };
    }
    const cleanPhone = formatEgyptianPhoneForBackend(rawPhone);

    // 2. Capacity validation against table if assigned
    const partySize = Number(payload.partySize || payload.guestsCount) || 2;
    if (payload.tableId) {
      const table = this.tables().find((t) => (t._id || t.id) === payload.tableId);
      if (table && table.capacity && partySize > table.capacity) {
        this.isSaving.set(false);
        return {
          success: false,
          error: `Party size (${partySize} guests) exceeds Table ${table.tableNumber} maximum seating capacity of ${table.capacity} guests.`,
        };
      }
    }

    // 3. Format reservedFor to future ISO string
    let reservedDate: Date;
    if (payload.date && payload.time) {
      reservedDate = new Date(`${payload.date}T${payload.time}:00`);
    } else if (payload.reservedFor) {
      reservedDate = new Date(payload.reservedFor);
    } else {
      reservedDate = new Date(Date.now() + 24 * 3600 * 1000);
    }

    if (isNaN(reservedDate.getTime()) || reservedDate.getTime() <= Date.now()) {
      reservedDate = new Date(Date.now() + 24 * 3600 * 1000);
      if (payload.time) {
        const [h, m] = payload.time.split(':').map(Number);
        reservedDate.setHours(h || 19, m || 0, 0, 0);
      }
    }

    const dto: CreateReservationDto = {
      tenantId,
      branchId,
      customerName: (payload.customerName || 'Guest').trim(),
      customerPhone: cleanPhone,
      partySize,
      reservedFor: reservedDate.toISOString(),
      channel: 'DASHBOARD',
      tableId: payload.tableId && /^[0-9a-fA-F]{24}$/.test(payload.tableId) ? payload.tableId : undefined,
      notes: payload.notes || payload.specialRequests || payload.occasion || undefined,
    };

    try {
      const res = await this.http
        .post<{ success: boolean; data: any }>(API_ENDPOINTS.reservations.create, dto)
        .toPromise();

      this.isSaving.set(false);
      if (res?.success && res.data) {
        this.fetchReservations();
        return { success: true, data: res.data };
      }
      return { success: false, error: 'Failed to create reservation' };
    } catch (err: any) {
      this.isSaving.set(false);
      console.warn('ReservationsService.createReservation error:', err);
      return { success: false, error: err?.error?.message || err?.message || 'Failed to create reservation' };
    }
  }

  async updateStatus(reservationId: string, status: ReservationStatus | string): Promise<boolean> {
    const s = String(status).toLowerCase();
    const uppercaseStatus =
      s === 'confirmed'
        ? 'CONFIRMED'
        : s === 'seated'
        ? 'SEATED'
        : s === 'cancelled'
        ? 'CANCELLED'
        : s === 'no_show'
        ? 'NO_SHOW'
        : 'CONFIRMED';

    // Optimistic UI update
    this.reservations.update((prev) =>
      prev.map((r) =>
        r.id === reservationId || r._id === reservationId
          ? { ...r, status: s as ReservationStatus }
          : r
      )
    );

    try {
      await this.http
        .patch<{ success: boolean; data: any }>(API_ENDPOINTS.reservations.update(reservationId), {
          status: uppercaseStatus,
        })
        .toPromise();

      this.fetchReservations();
      return true;
    } catch (err) {
      console.warn('updateStatus error:', err);
      this.fetchReservations();
      return false;
    }
  }

  async deleteReservation(reservationId: string): Promise<boolean> {
    try {
      await this.http.delete(API_ENDPOINTS.reservations.delete(reservationId)).toPromise();
      this.fetchReservations();
      return true;
    } catch (err) {
      console.warn('deleteReservation error:', err);
      this.fetchReservations();
      return false;
    }
  }
}
