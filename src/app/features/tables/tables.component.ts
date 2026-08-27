import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TablesService } from './tables.service';
import { RestaurantTable, TableStatus } from '../../shared/models/table.model';
import { EgpCurrencyPipe } from '../../shared/pipes/egyptian-currency.pipe';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EgpCurrencyPipe, AppIconComponent],
  template: `
    <div class="space-y-6 select-none animate-[fadeIn_0.3s_ease-out]">
      
      <!-- ── TOP BAR: Header, Zone Filters & Live Legend (Stitch Exact) ── -->
      <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-border shadow-xs">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
              Table Floor Plan &amp; Management
            </h1>
            <div class="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container border border-border rounded-full text-[11px] font-bold text-text-primary">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{{ tablesService.occupancyRate() }}% Occupancy</span>
            </div>
          </div>
          <p class="text-xs text-text-muted mt-0.5">
            Interactive floor layout, live table turnover, and guest seating velocity
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Zone Filter Tabs -->
          <div class="flex items-center bg-surface-container p-1 rounded-xl border border-border text-xs font-bold">
            @for (zone of zones; track zone.id) {
              <button
                type="button"
                (click)="selectedZone.set(zone.id)"
                [ngClass]="selectedZone() === zone.id ? 'bg-surface text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'"
                class="px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{{ zone.label }}</span>
                <span class="text-[10px] px-1.5 py-0.2 rounded-full font-bold opacity-80" [ngClass]="selectedZone() === zone.id ? 'bg-primary/10 text-primary' : 'bg-surface text-text-muted'">
                  {{ getTableCountForZone(zone.id) }}
                </span>
              </button>
            }
          </div>

          <!-- Status Legend -->
          <div class="flex items-center gap-3 text-xs font-bold bg-surface-container/60 px-3.5 py-2 rounded-xl border border-border">
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span class="text-text-muted text-[11px] font-semibold">{{ tablesService.availableTables().length }} Available</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span class="text-text-muted text-[11px] font-semibold">{{ tablesService.occupiedTables().length }} Seated</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
              <span class="text-text-muted text-[11px] font-semibold">{{ tablesService.billRequestedTables().length }} Bill Req</span>
            </div>
          </div>

          <!-- Add Table CTA -->
          <button
            type="button"
            (click)="showAddTableModal.set(true)"
            class="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-extrabold shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer"
          >
            <app-icon name="plus" customClass="w-4 h-4"></app-icon>
            <span>Add Table</span>
          </button>

          <!-- Refresh Button -->
          <button
            type="button"
            (click)="tablesService.fetchTables()"
            [disabled]="tablesService.isLoading()"
            class="p-2 rounded-xl bg-surface-container border border-border hover:bg-surface-hover text-text-primary transition cursor-pointer disabled:opacity-50"
            title="Refresh Tables"
          >
            <app-icon name="refresh-cw" [customClass]="tablesService.isLoading() ? 'w-4 h-4 animate-spin text-primary' : 'w-4 h-4'"></app-icon>
          </button>
        </div>
      </div>

      <!-- ── INTERACTIVE CANVAS FLOOR PLAN AREA ────────────── -->
      <div class="bg-surface rounded-2xl border border-border shadow-card p-6 min-h-[580px] relative overflow-hidden flex flex-col justify-between">
        
        <!-- Canvas Background Blueprint Dot Texture -->
        <div class="absolute inset-0 opacity-15 pointer-events-none" style="background-image: radial-gradient(circle at 10px 10px, currentColor 1.5px, transparent 1.5px); background-size: 36px 36px;"></div>

        <!-- Architectural Overlays -->
        <div class="absolute top-4 left-6 text-[10px] font-extrabold uppercase tracking-widest text-text-muted/60 flex items-center gap-1.5 pointer-events-none">
          <app-icon name="log-out" customClass="w-3.5 h-3.5 transform -rotate-90"></app-icon>
          <span>Main Entrance</span>
        </div>

        <div class="absolute bottom-4 right-6 text-[10px] font-extrabold uppercase tracking-widest text-text-muted/60 flex items-center gap-1.5 pointer-events-none">
          <app-icon name="chef-hat" customClass="w-3.5 h-3.5"></app-icon>
          <span>Kitchen Pass &amp; Stations</span>
        </div>

        <div class="absolute left-6 top-16 w-28 h-56 rounded-2xl bg-surface-container/40 border border-dashed border-border/70 flex items-center justify-center text-[11px] font-extrabold text-text-muted/50 transform -rotate-1 pointer-events-none">
          <div class="text-center">
            <app-icon name="wine" customClass="w-5 h-5 mx-auto mb-1 opacity-50"></app-icon>
            <span>Beverage Bar</span>
          </div>
        </div>

        <!-- Table Nodes Grid Canvas -->
        @if (tablesService.isLoading()) {
          <div class="flex-1 flex flex-col items-center justify-center py-20 text-text-muted">
            <app-icon name="refresh-cw" customClass="w-8 h-8 animate-spin text-primary mb-3"></app-icon>
            <p class="text-xs font-bold text-text-primary">Loading floor plan tables...</p>
          </div>
        } @else if (filteredTables().length === 0) {
          <div class="flex-1 flex flex-col items-center justify-center py-20 text-center text-text-muted">
            <div class="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mb-3 border border-border">
              <app-icon name="grid-2x2" customClass="w-7 h-7 opacity-40"></app-icon>
            </div>
            <h4 class="text-sm font-bold text-text-primary">No tables in this zone</h4>
            <p class="text-xs text-text-muted mt-1 max-w-xs">Click "Add Table" above to create dining tables for your restaurant floor.</p>
          </div>
        } @else {
          <div class="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 py-8 px-4 sm:px-12">
            @for (table of filteredTables(); track table.id || table._id) {
              <div
                (click)="openTablePopover(table, $event)"
                class="group relative rounded-2xl p-4 transition-all duration-300 cursor-pointer flex flex-col justify-between items-center text-center shadow-md hover:scale-105 border-2"
                [ngClass]="getTableNodeClasses(table)"
                style="min-height: 135px;"
              >
                <!-- Table Capacity Badge (Top Right) -->
                <div class="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-surface border border-border shadow-xs flex items-center justify-center text-[10px] font-black text-text-primary">
                  {{ table.capacity }}
                </div>

                <!-- Table Number Title -->
                <div class="pt-1">
                  <span class="text-base sm:text-lg font-black tracking-tight block">
                    {{ table.name || 'Table ' + table.tableNumber }}
                  </span>
                  <span class="text-[10px] font-bold opacity-80 uppercase block mt-0.5">
                    {{ table.section }}
                  </span>
                </div>

                <!-- Status Info Tag -->
                <div class="my-1.5">
                  @if (table.status === 'occupied' || table.status === 'OCCUPIED') {
                    <span class="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-extrabold block">
                      {{ table.seatedMinutes ? table.seatedMinutes + 'm seated' : 'Seated' }}
                    </span>
                    @if (table.currentOrderTotal) {
                      <span class="text-[10px] font-black block mt-1">
                        {{ table.currentOrderTotal | egpCurrency }}
                      </span>
                    }
                  } @else if (table.status === 'bill_requested') {
                    <span class="px-2 py-0.5 rounded-full bg-white text-purple-950 text-[10px] font-black animate-pulse block">
                      Bill Req
                    </span>
                  } @else if (table.status === 'reserved' || table.status === 'RESERVED') {
                    <span class="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold block">
                      Reserved
                    </span>
                  } @else {
                    <span class="text-[11px] font-extrabold opacity-90 block">
                      Available
                    </span>
                  }
                </div>

                <!-- Table Capacity Indicator -->
                <div class="text-[10px] opacity-75 font-semibold">
                  {{ table.capacity }} Seats
                </div>
              </div>
            }
          </div>
        }

        <!-- Canvas Footer Stats -->
        <div class="relative z-10 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-muted">
          <div class="flex items-center gap-4 font-semibold">
            <span>Total Tables: <strong class="text-text-primary">{{ tablesService.tables().length }}</strong></span>
            <span>Total Capacity: <strong class="text-text-primary">{{ tablesService.totalCapacity() }} seats</strong></span>
          </div>
          <div>
            Click any table to view order, request bill, or change seating status
          </div>
        </div>

      </div>

      <!-- ── CONTEXTUAL TABLE ACTION POPOVER MODAL ─────────── -->
      @if (selectedTable()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <!-- Backdrop -->
          <div (click)="selectedTable.set(null)" class="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"></div>

          <div class="relative bg-surface rounded-2xl border border-border p-6 shadow-2xl max-w-sm w-full space-y-5 animate-scale-up">
            
            <!-- Popover Header -->
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-lg font-black text-text-primary">
                  {{ selectedTable()?.name || 'Table ' + selectedTable()?.tableNumber }}
                </h3>
                <p class="text-xs text-text-muted font-medium">
                  {{ selectedTable()?.section }} Zone • {{ selectedTable()?.capacity }} Guest Seats
                </p>
              </div>
              <button
                type="button"
                (click)="selectedTable.set(null)"
                class="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-container transition cursor-pointer"
              >
                <app-icon name="x" customClass="w-4 h-4"></app-icon>
              </button>
            </div>

            <!-- Current Table Status Banner -->
            <div class="p-3.5 rounded-xl border flex items-center justify-between" [ngClass]="getPopoverBannerClasses(selectedTable()?.status)">
              <div>
                <span class="text-[10px] font-bold uppercase opacity-80 block">Current Status</span>
                <span class="text-xs font-black capitalize">{{ selectedTable()?.status }}</span>
              </div>
              @if (selectedTable()?.currentOrderTotal) {
                <div class="text-right">
                  <span class="text-[10px] font-bold uppercase opacity-80 block">Tab Total</span>
                  <span class="text-xs font-black">{{ selectedTable()?.currentOrderTotal | egpCurrency }}</span>
                </div>
              }
            </div>

            <!-- QR Code Scan Link / Image Action -->
            <div class="p-3 bg-surface-container rounded-xl border border-border text-[11px] flex items-center justify-between">
              <div>
                <span class="font-bold text-text-primary block">QR Digital Menu Scan</span>
                <span class="text-text-muted text-[10px]">Table self-ordering active</span>
              </div>
              <button
                type="button"
                (click)="openQrModal(selectedTable()!)"
                class="px-2.5 py-1 bg-primary text-white rounded-lg font-bold text-[10px] hover:opacity-90 transition cursor-pointer flex items-center gap-1"
              >
                <app-icon name="sparkles" customClass="w-3 h-3"></app-icon>
                <span>View QR</span>
              </button>
            </div>

            <!-- Context Actions -->
            <div class="space-y-2 text-xs font-bold">
              
              <!-- 1. Open POS Order -->
              <a
                routerLink="/pos"
                (click)="selectedTable.set(null)"
                class="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-container hover:bg-surface-hover text-text-primary border border-border transition cursor-pointer"
              >
                <app-icon name="plus-circle" customClass="w-4 h-4 text-primary"></app-icon>
                <div class="text-left">
                  <div class="text-xs font-bold text-text-primary">Open POS for Table</div>
                  <div class="text-[10px] text-text-muted font-normal">Add food items or create dining bill</div>
                </div>
              </a>

              <!-- 2. Request Bill / Checkout -->
              @if (selectedTable()?.status === 'occupied' || selectedTable()?.status === 'OCCUPIED') {
                <button
                  type="button"
                  (click)="setTableStatus('bill_requested')"
                  class="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 transition cursor-pointer"
                >
                  <app-icon name="receipt-long" customClass="w-4 h-4"></app-icon>
                  <div class="text-left">
                    <div class="text-xs font-bold">Request Guest Bill</div>
                    <div class="text-[10px] opacity-80 font-normal">Alert cashier station to print check</div>
                  </div>
                </button>
              }

              <!-- 3. Mark Occupied / Seated -->
              @if (selectedTable()?.status === 'available' || selectedTable()?.status === 'vacant') {
                <button
                  type="button"
                  (click)="setTableStatus('occupied')"
                  class="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition cursor-pointer"
                >
                  <app-icon name="users" customClass="w-4 h-4"></app-icon>
                  <div class="text-left">
                    <div class="text-xs font-bold">Seat Walk-in Guests</div>
                    <div class="text-[10px] opacity-80 font-normal">Mark table occupied</div>
                  </div>
                </button>
              }

              <!-- 4. Mark Clean & Available -->
              @if (selectedTable()?.status !== 'available' && selectedTable()?.status !== 'vacant') {
                <button
                  type="button"
                  (click)="setTableStatus('available')"
                  class="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition cursor-pointer"
                >
                  <app-icon name="cleaning-services" customClass="w-4 h-4"></app-icon>
                  <div class="text-left">
                    <div class="text-xs font-bold">Mark Clean &amp; Ready</div>
                    <div class="text-[10px] opacity-80 font-normal">Reset table for next dining party</div>
                  </div>
                </button>
              }

            </div>

          </div>
        </div>
      }

      <!-- ── ADD NEW TABLE MODAL ────────────────────────────── -->
      @if (showAddTableModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div (click)="showAddTableModal.set(false)" class="absolute inset-0 bg-black/60 backdrop-blur-xs"></div>
          <div class="relative bg-surface rounded-2xl border border-border p-6 shadow-2xl max-w-sm w-full space-y-4">
            <h3 class="text-sm font-extrabold text-text-primary">Add Dining Table</h3>
            
            <div>
              <label class="block font-bold text-text-primary text-xs mb-1">Table Number *</label>
              <input
                type="number"
                [(ngModel)]="newTableNumber"
                min="1"
                placeholder="e.g. 3"
                class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs text-text-primary font-bold focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label class="block font-bold text-text-primary text-xs mb-1">Seating Capacity *</label>
              <input
                type="number"
                [(ngModel)]="newTableCapacity"
                min="1"
                max="20"
                placeholder="e.g. 4"
                class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs text-text-primary font-bold focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label class="block font-bold text-text-primary text-xs mb-1">Floor Section / Zone</label>
              <select
                [(ngModel)]="newTableSection"
                class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs text-text-primary font-semibold focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="Main Dining">Main Dining</option>
                <option value="Patio">Patio</option>
                <option value="Bar">Bar</option>
                <option value="VIP Lounge">VIP Lounge</option>
              </select>
            </div>

            <div class="flex items-center gap-3 pt-2">
              <button
                type="button"
                (click)="showAddTableModal.set(false)"
                class="flex-1 py-2.5 rounded-xl bg-surface-container text-text-primary text-xs font-bold hover:bg-surface-hover transition"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="saveNewTable()"
                [disabled]="!newTableNumber || !newTableCapacity || tablesService.isSaving()"
                class="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-extrabold shadow-sm hover:opacity-90 disabled:opacity-50 transition"
              >
                {{ tablesService.isSaving() ? 'Saving...' : 'Create Table' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ── QR CODE VIEWER MODAL ──────────────────────────── -->
      @if (viewingQrTable()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div (click)="viewingQrTable.set(null)" class="absolute inset-0 bg-black/70 backdrop-blur-xs animate-[fadeIn_0.2s_ease-out]"></div>

          <div class="relative bg-surface rounded-2xl border border-border p-6 shadow-2xl max-w-sm w-full space-y-4 text-center animate-[fadeIn_0.2s_ease-out]">
            <!-- Modal Header -->
            <div class="flex items-center justify-between border-b border-border pb-3">
              <div class="text-left">
                <h3 class="text-base font-extrabold text-text-primary">
                  {{ viewingQrTable()?.name || 'Table ' + viewingQrTable()?.tableNumber }}
                </h3>
                <p class="text-xs text-text-muted">
                  {{ viewingQrTable()?.section }} Zone • Scan to Order
                </p>
              </div>
              <button
                type="button"
                (click)="viewingQrTable.set(null)"
                class="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-container transition cursor-pointer"
              >
                <app-icon name="x" customClass="w-4 h-4"></app-icon>
              </button>
            </div>

            <!-- QR Image Display -->
            <div class="p-4 bg-white rounded-2xl border border-border inline-block shadow-inner mx-auto my-1 min-w-[220px] min-h-[220px] flex items-center justify-center">
              @if (qrImageLoading()) {
                <div class="flex flex-col items-center justify-center py-10 text-neutral-400">
                  <app-icon name="refresh-cw" customClass="w-8 h-8 animate-spin text-primary mb-2"></app-icon>
                  <span class="text-xs font-bold text-neutral-600">Generating Table QR...</span>
                </div>
              } @else if (qrImageDataUrl()) {
                <img
                  [src]="qrImageDataUrl()"
                  [alt]="'QR Code for Table ' + viewingQrTable()?.tableNumber"
                  class="w-48 h-48 object-contain mx-auto"
                />
              } @else {
                <div class="flex flex-col items-center justify-center py-10 text-red-500">
                  <app-icon name="alert-triangle" customClass="w-8 h-8 mb-2"></app-icon>
                  <span class="text-xs font-bold">Failed to load QR image</span>
                </div>
              }
            </div>

            <p class="text-[11px] text-text-muted leading-relaxed">
              Guests scan this QR code at Table {{ viewingQrTable()?.tableNumber }} to browse the digital menu and place live orders.
            </p>

            <!-- Actions -->
            <div class="flex items-center gap-2 pt-2">
              @if (viewingQrTable()?.qrCodeUrl) {
                <a
                  [href]="viewingQrTable()?.qrCodeUrl"
                  target="_blank"
                  class="flex-1 py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-hover text-text-primary text-xs font-bold transition flex items-center justify-center gap-1.5 border border-border"
                >
                  <app-icon name="sparkles" customClass="w-3.5 h-3.5 text-primary"></app-icon>
                  <span>Open Scan Link</span>
                </a>
              }
              <button
                type="button"
                (click)="downloadQrImage()"
                [disabled]="!qrImageDataUrl() || qrImageLoading()"
                class="flex-1 py-2.5 px-3 rounded-xl bg-primary text-white text-xs font-extrabold shadow-sm hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <app-icon name="arrow-right" customClass="w-3.5 h-3.5"></app-icon>
                <span>Download PNG</span>
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `,
})
export default class TablesComponent implements OnInit, OnDestroy {
  readonly tablesService = inject(TablesService);

  readonly selectedZone = signal<string>('all');
  readonly selectedTable = signal<RestaurantTable | null>(null);
  readonly viewingQrTable = signal<RestaurantTable | null>(null);
  readonly qrImageDataUrl = signal<string | null>(null);
  readonly qrImageLoading = signal<boolean>(false);
  readonly showAddTableModal = signal<boolean>(false);

  newTableNumber = 4;
  newTableCapacity = 4;
  newTableSection = 'Main Dining';

  readonly zones = [
    { id: 'all', label: 'All Zones' },
    { id: 'Main Dining', label: 'Main Dining' },
    { id: 'Patio', label: 'Patio' },
    { id: 'Bar', label: 'Bar' },
    { id: 'VIP Lounge', label: 'VIP Lounge' },
  ];

  readonly filteredTables = computed(() => {
    const list = this.tablesService.tables();
    const zone = this.selectedZone();
    if (zone === 'all') return list;
    return list.filter((t) => (t.section || t.zone || '').toLowerCase() === zone.toLowerCase());
  });

  getTableCountForZone(zoneId: string): number {
    if (zoneId === 'all') return this.tablesService.tables().length;
    return this.tablesService.tables().filter(
      (t) => (t.section || t.zone || '').toLowerCase() === zoneId.toLowerCase()
    ).length;
  }

  ngOnInit(): void {
    this.tablesService.startAutoPolling(30000);
  }

  ngOnDestroy(): void {
    this.tablesService.stopAutoPolling();
  }

  getTableNodeClasses(table: RestaurantTable): string {
    const status = (table.status || '').toLowerCase();
    switch (status) {
      case 'available':
      case 'vacant':
        return 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white shadow-emerald-900/20';
      case 'occupied':
        return 'bg-amber-600 hover:bg-amber-500 border-amber-400 text-white shadow-amber-900/20';
      case 'bill_requested':
        return 'bg-purple-600 hover:bg-purple-500 border-purple-300 text-white animate-pulse shadow-purple-900/30';
      case 'reserved':
        return 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white shadow-blue-900/20';
      default:
        return 'bg-surface-container border-border text-text-primary';
    }
  }

  getPopoverBannerClasses(status?: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'occupied') return 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400';
    if (s === 'bill_requested') return 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400';
    if (s === 'reserved') return 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400';
    return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
  }

  openTablePopover(table: RestaurantTable, event: Event): void {
    event.stopPropagation();
    this.selectedTable.set(table);
  }

  openQrModal(table: RestaurantTable): void {
    this.selectedTable.set(null);
    this.viewingQrTable.set(table);
    this.qrImageDataUrl.set(null);
    this.qrImageLoading.set(true);

    const tableId = table.id || table._id;
    if (tableId) {
      this.tablesService.fetchQrImageBlob(tableId).subscribe({
        next: (blob) => {
          this.qrImageLoading.set(false);
          const objectUrl = URL.createObjectURL(blob);
          this.qrImageDataUrl.set(objectUrl);
        },
        error: (err) => {
          this.qrImageLoading.set(false);
          console.warn('Failed to load table QR code image:', err);
        },
      });
    }
  }

  downloadQrImage(): void {
    const dataUrl = this.qrImageDataUrl();
    const table = this.viewingQrTable();
    if (!dataUrl || !table) return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `table-${table.tableNumber}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async setTableStatus(status: TableStatus): Promise<void> {
    const table = this.selectedTable();
    const id = table?.id || table?._id;
    if (id) {
      await this.tablesService.updateTableStatus(id, status);
      this.selectedTable.set(null);
    }
  }

  async saveNewTable(): Promise<void> {
    if (!this.newTableNumber || !this.newTableCapacity) return;
    const ok = await this.tablesService.createTable(this.newTableNumber, this.newTableCapacity, this.newTableSection);
    if (ok) {
      this.showAddTableModal.set(false);
      this.newTableNumber = this.newTableNumber + 1;
    }
  }
}
