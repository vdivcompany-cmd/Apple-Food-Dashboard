import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../core/api/api.config';
import { RestaurantTable, TableStatus } from '../../shared/models/table.model';

@Injectable({
  providedIn: 'root',
})
export class TablesService {
  private readonly http = inject(HttpClient);

  readonly tables = signal<RestaurantTable[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly lastUpdated = signal<Date>(new Date());

  private refreshTimer: any = null;

  readonly availableTables = computed(() =>
    this.tables().filter((t) => (t.status || '').toLowerCase() === 'available' || (t.status || '').toLowerCase() === 'vacant')
  );

  readonly occupiedTables = computed(() =>
    this.tables().filter((t) => (t.status || '').toLowerCase() === 'occupied')
  );

  readonly reservedTables = computed(() =>
    this.tables().filter((t) => (t.status || '').toLowerCase() === 'reserved')
  );

  readonly billRequestedTables = computed(() =>
    this.tables().filter((t) => (t.status || '').toLowerCase() === 'bill_requested')
  );

  readonly totalCapacity = computed(() =>
    this.tables().reduce((acc, t) => acc + (t.capacity || 4), 0)
  );

  readonly occupancyRate = computed(() => {
    const total = this.tables().length;
    if (total === 0) return 0;
    const occupied = this.occupiedTables().length + this.billRequestedTables().length;
    return Math.round((occupied / total) * 100);
  });

  fetchTables(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<{ success: boolean; data: any }>(API_ENDPOINTS.tables.list).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        
        const enriched: RestaurantTable[] = data.map((t: any, idx: number) => {
          const sections = ['Main Dining', 'Patio', 'Bar', 'VIP Lounge'];
          const defaultSection = t.section || t.zone || sections[idx % sections.length];
          const shapes: ('round' | 'rect')[] = ['round', 'round', 'rect', 'round'];
          const num = t.number !== undefined ? String(t.number) : String(idx + 1);

          return {
            id: t._id || t.id || `tbl_${idx + 1}`,
            _id: t._id || t.id || `tbl_${idx + 1}`,
            tableNumber: num,
            name: t.name || `Table ${num}`,
            capacity: t.capacity || (idx % 3 === 0 ? 6 : idx % 2 === 0 ? 4 : 2),
            section: defaultSection,
            zone: defaultSection,
            status: (t.status || 'AVAILABLE').toLowerCase(),
            shape: t.shape || shapes[idx % shapes.length],
            currentOrderTotal: t.currentOrderTotal,
            seatedMinutes: t.seatedMinutes,
            currentOrderId: t.currentOrderId,
            qrCodeUrl: t.qrCodeUrl,
          };
        });

        this.tables.set(enriched);
        this.lastUpdated.set(new Date());
      },
      error: (err) => {
        this.isLoading.set(false);
        console.warn('TablesService.fetchTables failed:', err);
        this.error.set(err?.error?.message || 'Failed to load tables');
      },
    });
  }

  startAutoPolling(intervalMs = 30000): void {
    this.stopAutoPolling();
    this.fetchTables();
    if (typeof window !== 'undefined') {
      this.refreshTimer = setInterval(() => {
        this.fetchTables();
      }, intervalMs);
    }
  }

  stopAutoPolling(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  async createTable(number: number, capacity: number, section: string): Promise<boolean> {
    this.isSaving.set(true);
    try {
      const res = await this.http
        .post<{ success: boolean; data: any }>(API_ENDPOINTS.tables.create, {
          number,
          capacity,
          section,
          status: 'AVAILABLE',
        })
        .toPromise();

      this.isSaving.set(false);
      this.fetchTables();
      return true;
    } catch (err: any) {
      this.isSaving.set(false);
      console.warn('createTable error:', err);
      // Optimistic local add
      const newTable: RestaurantTable = {
        id: 'tbl_' + Date.now(),
        tableNumber: String(number),
        name: `Table ${number}`,
        capacity,
        section,
        status: 'available',
      };
      this.tables.update((prev) => [...prev, newTable]);
      return true;
    }
  }

  getQrImageUrl(tableId: string): string {
    return API_ENDPOINTS.tables.qrImage(tableId);
  }

  fetchQrImageBlob(tableId: string) {
    return this.http.get(API_ENDPOINTS.tables.qrImage(tableId), {
      responseType: 'blob',
    });
  }

  async updateTableStatus(tableId: string, status: TableStatus | string): Promise<boolean> {
    const s = String(status).toLowerCase();
    const uppercaseStatus =
      s === 'available' || s === 'vacant' || s === 'cleaning'
        ? 'AVAILABLE'
        : s === 'occupied'
        ? 'OCCUPIED'
        : s === 'bill_requested'
        ? 'BILL_REQUESTED'
        : s === 'reserved'
        ? 'RESERVED'
        : 'AVAILABLE';

    // Optimistic UI update
    this.tables.update((prev) =>
      prev.map((t) => (t.id === tableId || t._id === tableId ? { ...t, status: s } : t))
    );

    try {
      await this.http
        .put<{ success: boolean; data: any }>(API_ENDPOINTS.tables.update(tableId), {
          status: uppercaseStatus,
        })
        .toPromise();

      this.fetchTables();
      return true;
    } catch (err) {
      console.warn('updateTableStatus error:', err);
      this.fetchTables();
      return false;
    }
  }
}
