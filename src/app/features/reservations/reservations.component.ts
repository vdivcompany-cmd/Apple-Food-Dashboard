import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationsService } from './reservations.service';
import { Reservation, ReservationStatus } from '../../shared/models/reservation.model';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    <div class="space-y-6 select-none animate-[fadeIn_0.3s_ease-out]">
      
      <!-- ── TOP ACTION BAR (Stitch Layout) ───────────────── -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-border shadow-xs">
        <div class="flex flex-wrap items-center gap-3">
          <div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
              Reservations Board
            </h1>
            <p class="text-xs text-text-muted mt-0.5">
              Guest bookings, timeline seating schedule, and VIP table assignments
            </p>
          </div>

          <!-- Date Filters -->
          <div class="flex items-center bg-surface-container p-1 rounded-xl border border-border text-xs font-bold sm:ml-4">
            <button
              type="button"
              (click)="selectedDateFilter.set('today')"
              [ngClass]="selectedDateFilter() === 'today' ? 'bg-surface text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'"
              class="px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              (click)="selectedDateFilter.set('tomorrow')"
              [ngClass]="selectedDateFilter() === 'tomorrow' ? 'bg-surface text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'"
              class="px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              Tomorrow
            </button>
            <button
              type="button"
              (click)="selectedDateFilter.set('all')"
              [ngClass]="selectedDateFilter() === 'all' ? 'bg-surface text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'"
              class="px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              All Upcoming
            </button>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <!-- Status Legend -->
          <div class="hidden sm:flex items-center gap-3 text-xs font-bold bg-surface-container/60 px-3.5 py-2 rounded-xl border border-border">
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
              <span class="text-text-muted text-[11px]">Pending</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span class="text-text-muted text-[11px]">Confirmed</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span>
              <span class="text-text-muted text-[11px]">Seated</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-red-500"></span>
              <span class="text-text-muted text-[11px]">Cancelled</span>
            </div>
          </div>

          <!-- New Booking CTA -->
          <button
            type="button"
            (click)="openNewBookingDrawer()"
            class="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-extrabold shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer"
          >
            <app-icon name="plus" customClass="w-4 h-4"></app-icon>
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      <!-- ── SPLIT MAIN CONTENT: TIMELINE VIEW + BOOKINGS LIST ── -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[640px]">
        
        <!-- ── 1. LEFT: ZONE TIMELINE GRID (xl:col-span-8) ──── -->
        <div class="xl:col-span-8 bg-surface rounded-2xl border border-border shadow-card overflow-hidden flex flex-col">
          
          <!-- Timeline Header Row -->
          <div class="grid grid-cols-5 bg-surface-container/80 border-b border-border p-3 text-xs font-extrabold text-text-primary sticky top-0 z-20">
            <div class="text-text-muted uppercase text-[10px] tracking-wider">Time Slot</div>
            <div class="text-center">Main Floor</div>
            <div class="text-center">Patio</div>
            <div class="text-center">Bar</div>
            <div class="text-center">VIP Room</div>
          </div>

          <!-- Timeline Time Slot Rows -->
          <div class="flex-1 overflow-y-auto divide-y divide-border/60 relative">
            
            @if (reservationsService.isLoading()) {
              <div class="py-20 flex flex-col items-center justify-center text-text-muted">
                <app-icon name="refresh-cw" customClass="w-7 h-7 animate-spin text-primary mb-2"></app-icon>
                <span class="text-xs font-bold">Loading reservations schedule...</span>
              </div>
            } @else {
              @for (slot of timeSlots; track slot) {
                <div class="grid grid-cols-5 min-h-[76px] hover:bg-surface-container/30 transition relative group">
                  
                  <!-- Slot Time Label -->
                  <div class="p-3 bg-surface-container-low/40 border-r border-border flex items-center justify-center text-xs font-black text-text-muted group-hover:text-primary transition">
                    {{ slot }}
                  </div>

                  <!-- Zone 1: Main Floor -->
                  <div class="p-1.5 border-r border-border relative">
                    @for (res of getReservationsForSlotAndZone(slot, 'Main Floor'); track res.id || res._id) {
                      <div
                        (click)="selectBooking(res)"
                        class="p-2 rounded-xl border transition cursor-pointer text-xs flex flex-col justify-between shadow-xs mb-1 hover:scale-[1.02]"
                        [ngClass]="getBookingBadgeClasses(res.status)"
                      >
                        <div class="flex items-center justify-between font-bold">
                          <span class="truncate">{{ res.customerName }}</span>
                          <span class="text-[10px] opacity-80">{{ res.guestsCount }}p</span>
                        </div>
                        <div class="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                          <span>{{ res.tableNumber || 'T-01' }}</span>
                          @if (res.occasion) {
                            <span>• {{ res.occasion }}</span>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Zone 2: Patio -->
                  <div class="p-1.5 border-r border-border relative">
                    @for (res of getReservationsForSlotAndZone(slot, 'Patio'); track res.id || res._id) {
                      <div
                        (click)="selectBooking(res)"
                        class="p-2 rounded-xl border transition cursor-pointer text-xs flex flex-col justify-between shadow-xs mb-1 hover:scale-[1.02]"
                        [ngClass]="getBookingBadgeClasses(res.status)"
                      >
                        <div class="flex items-center justify-between font-bold">
                          <span class="truncate">{{ res.customerName }}</span>
                          <span class="text-[10px] opacity-80">{{ res.guestsCount }}p</span>
                        </div>
                        <div class="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                          <span>{{ res.tableNumber || 'P-01' }}</span>
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Zone 3: Bar -->
                  <div class="p-1.5 border-r border-border relative">
                    @for (res of getReservationsForSlotAndZone(slot, 'Bar'); track res.id || res._id) {
                      <div
                        (click)="selectBooking(res)"
                        class="p-2 rounded-xl border transition cursor-pointer text-xs flex flex-col justify-between shadow-xs mb-1 hover:scale-[1.02]"
                        [ngClass]="getBookingBadgeClasses(res.status)"
                      >
                        <div class="flex items-center justify-between font-bold">
                          <span class="truncate">{{ res.customerName }}</span>
                          <span class="text-[10px] opacity-80">{{ res.guestsCount }}p</span>
                        </div>
                        <div class="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                          <span>{{ res.tableNumber || 'B-01' }}</span>
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Zone 4: VIP Lounge -->
                  <div class="p-1.5 relative">
                    @for (res of getReservationsForSlotAndZone(slot, 'VIP Room'); track res.id || res._id) {
                      <div
                        (click)="selectBooking(res)"
                        class="p-2 rounded-xl border transition cursor-pointer text-xs flex flex-col justify-between shadow-xs mb-1 hover:scale-[1.02]"
                        [ngClass]="getBookingBadgeClasses(res.status)"
                      >
                        <div class="flex items-center justify-between font-bold">
                          <span class="truncate">{{ res.customerName }}</span>
                          <span class="text-[10px] opacity-80">{{ res.guestsCount }}p</span>
                        </div>
                        <div class="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                          <span>{{ res.tableNumber || 'VIP-1' }}</span>
                          @if (res.occasion) {
                            <span>• {{ res.occasion }}</span>
                          }
                        </div>
                      </div>
                    }
                  </div>

                </div>
              }
            }

          </div>
        </div>

        <!-- ── 2. RIGHT: TODAY'S BOOKINGS FEED (xl:col-span-4) ─ -->
        <div class="xl:col-span-4 bg-surface rounded-2xl border border-border shadow-card p-5 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-sm font-extrabold text-text-primary">Guest Bookings</h3>
                <p class="text-xs text-text-muted">Live upcoming guest schedule</p>
              </div>
              <span class="px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                {{ filteredBookings().length }} Guests
              </span>
            </div>

            <!-- Booking Cards Feed -->
            <div class="space-y-3 overflow-y-auto max-h-[520px] pr-1">
              @if (filteredBookings().length === 0) {
                <div class="text-center py-12 text-text-muted text-xs">
                  <app-icon name="calendar" customClass="w-8 h-8 opacity-30 mx-auto mb-2"></app-icon>
                  <p class="font-bold text-text-primary">No reservations found</p>
                  <p class="text-[11px] text-text-muted mt-0.5">Click "+ New Reservation" to schedule a booking.</p>
                </div>
              } @else {
                @for (booking of filteredBookings(); track booking.id || booking._id) {
                  <div
                    class="p-4 rounded-xl bg-surface-container/60 hover:bg-surface-container border border-border transition flex flex-col gap-3 group"
                  >
                    <div class="flex items-start justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-extrabold text-xs">
                          {{ getInitials(booking.customerName) }}
                        </div>
                        <div>
                          <h4 class="text-xs font-extrabold text-text-primary">{{ booking.customerName }}</h4>
                          <div class="text-[11px] text-text-muted flex items-center gap-1.5 mt-0.5">
                            <app-icon name="phone" customClass="w-3 h-3 text-text-muted"></app-icon>
                            <span>{{ booking.customerPhone }}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border"
                        [ngClass]="getStatusPillClasses(booking.status)"
                      >
                        {{ booking.status }}
                      </span>
                    </div>

                    <div class="grid grid-cols-3 gap-2 text-[11px] bg-surface p-2.5 rounded-xl border border-border">
                      <div>
                        <span class="text-[10px] text-text-muted block">Time</span>
                        <strong class="text-text-primary">{{ booking.time }}</strong>
                      </div>
                      <div>
                        <span class="text-[10px] text-text-muted block">Party Size</span>
                        <strong class="text-text-primary">{{ booking.guestsCount }} Guests</strong>
                      </div>
                      <div>
                        <span class="text-[10px] text-text-muted block">Table</span>
                        <strong class="text-primary">{{ booking.tableNumber || 'Assigned' }}</strong>
                      </div>
                    </div>

                    <!-- Quick Status Actions -->
                    <div class="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
                      @if (booking.status === 'pending' || booking.status === 'PENDING') {
                        <button
                          type="button"
                          (click)="changeStatus(booking, 'confirmed')"
                          class="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[11px] font-bold border border-emerald-500/20 transition cursor-pointer"
                        >
                          Confirm
                        </button>
                      }
                      @if (booking.status === 'confirmed' || booking.status === 'CONFIRMED') {
                        <button
                          type="button"
                          (click)="changeStatus(booking, 'seated')"
                          class="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-[11px] font-bold border border-amber-500/20 transition cursor-pointer"
                        >
                          Seat Guests
                        </button>
                      }
                      @if (booking.status !== 'cancelled' && booking.status !== 'CANCELLED') {
                        <button
                          type="button"
                          (click)="changeStatus(booking, 'cancelled')"
                          class="px-2.5 py-1 text-text-muted hover:text-red-500 rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      }
                    </div>

                  </div>
                }
              }
            </div>
          </div>

          <div class="pt-3 border-t border-border mt-3 text-center text-xs text-text-muted font-medium">
            Auto-synced with online table reservations
          </div>
        </div>

      </div>

      <!-- ── NEW RESERVATION SLIDE-IN DRAWER ────────────────── -->
      @if (showDrawer()) {
        <div class="fixed inset-0 z-50 overflow-hidden">
          <div (click)="showDrawer.set(false)" class="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"></div>

          <div class="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div class="w-screen max-w-md bg-surface border-l border-border shadow-2xl flex flex-col justify-between animate-slide-in">
              
              <!-- Drawer Header -->
              <div class="p-6 border-b border-border flex items-center justify-between bg-surface-container/50">
                <div>
                  <h3 class="text-base font-extrabold text-text-primary">
                    Create Guest Reservation
                  </h3>
                  <p class="text-xs text-text-muted mt-0.5">
                    Record guest contact, party size &amp; table assignment
                  </p>
                </div>
                <button
                  type="button"
                  (click)="showDrawer.set(false)"
                  class="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface transition cursor-pointer"
                >
                  <app-icon name="x" customClass="w-4 h-4"></app-icon>
                </button>
              </div>

              <!-- Drawer Form -->
              <div class="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                
                <div>
                  <label class="block font-bold text-text-primary mb-1">Guest Full Name *</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.customerName"
                    placeholder="e.g. Dr. Sherif Mansour"
                    class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition"
                  />
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-text-primary mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      [(ngModel)]="formData.customerPhone"
                      placeholder="+20 100 000 0000"
                      class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition"
                    />
                  </div>
                  <div>
                    <label class="block font-bold text-text-primary mb-1">Party Size (Guests) *</label>
                    <input
                      type="number"
                      [(ngModel)]="formData.guestsCount"
                      min="1"
                      max="30"
                      class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-bold focus:outline-none focus:border-primary transition"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-text-primary mb-1">Date *</label>
                    <input
                      type="date"
                      [(ngModel)]="formData.date"
                      class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition cursor-pointer"
                    />
                  </div>
                  <div>
                    <label class="block font-bold text-text-primary mb-1">Time Slot *</label>
                    <select
                      [(ngModel)]="formData.time"
                      class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition cursor-pointer"
                    >
                      @for (slot of timeSlots; track slot) {
                        <option [value]="slot">{{ slot }}</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-text-primary mb-1">Section / Zone</label>
                    <select
                      [(ngModel)]="formData.section"
                      class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition cursor-pointer"
                    >
                      <option value="Main Floor">Main Floor</option>
                      <option value="Patio">Patio</option>
                      <option value="Bar">Bar</option>
                      <option value="VIP Room">VIP Room</option>
                    </select>
                  </div>
                  <div>
                    <label class="block font-bold text-text-primary mb-1">Assigned Table</label>
                    <input
                      type="text"
                      [(ngModel)]="formData.tableNumber"
                      placeholder="e.g. Table #04"
                      class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition"
                    />
                  </div>
                </div>

                <div>
                  <label class="block font-bold text-text-primary mb-1">Occasion / VIP Notes</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.occasion"
                    placeholder="e.g. Anniversary Dinner, Birthday, High Priority Guest"
                    class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary transition"
                  />
                </div>

                <div>
                  <label class="block font-bold text-text-primary mb-1">Special Dietary / Seating Requests</label>
                  <textarea
                    [(ngModel)]="formData.specialRequests"
                    rows="2"
                    placeholder="High chair needed, quiet booth preferred..."
                    class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary transition"
                  ></textarea>
                </div>

              </div>

              <!-- Drawer Footer -->
              <div class="p-6 border-t border-border bg-surface-container/50 flex items-center gap-3">
                <button
                  type="button"
                  (click)="showDrawer.set(false)"
                  class="flex-1 py-3 rounded-xl bg-surface-container hover:bg-surface-hover text-text-primary font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  (click)="saveReservation()"
                  [disabled]="reservationsService.isSaving() || !formData.customerName || !formData.customerPhone"
                  class="flex-1 py-3 rounded-xl bg-primary text-white font-extrabold text-xs shadow-md hover:opacity-90 active:scale-95 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  @if (reservationsService.isSaving()) {
                    <app-icon name="refresh-cw" customClass="w-3.5 h-3.5 animate-spin"></app-icon>
                    <span>Saving...</span>
                  } @else {
                    <span>Confirm Booking</span>
                  }
                </button>
              </div>

            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export default class ReservationsComponent implements OnInit {
  readonly reservationsService = inject(ReservationsService);

  readonly selectedDateFilter = signal<'today' | 'tomorrow' | 'all'>('today');
  readonly showDrawer = signal<boolean>(false);

  readonly timeSlots = [
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
  ];

  formData: Partial<Reservation> = {
    customerName: '',
    customerPhone: '',
    guestsCount: 2,
    date: new Date().toISOString().slice(0, 10),
    time: '19:00',
    section: 'Main Floor',
    tableNumber: 'T-01',
    occasion: '',
    specialRequests: '',
    status: 'confirmed',
  };

  readonly filteredBookings = computed(() => {
    const list = this.reservationsService.reservations();
    const filter = this.selectedDateFilter();
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    if (filter === 'today') {
      return list.filter((r) => r.date?.startsWith(today) || !r.date);
    }
    if (filter === 'tomorrow') {
      return list.filter((r) => r.date?.startsWith(tomorrow));
    }
    return list;
  });

  ngOnInit(): void {
    this.reservationsService.fetchReservations();
  }

  getReservationsForSlotAndZone(slot: string, zone: string): Reservation[] {
    return this.filteredBookings().filter((r) => {
      const slotMatch = (r.time || '').startsWith(slot) || (r.time || '').replace(':', '') === slot.replace(':', '');
      const zoneMatch = (r.section || r.zone || 'Main Floor').toLowerCase().includes(zone.toLowerCase().replace('room', '').trim());
      return slotMatch && zoneMatch;
    });
  }

  getBookingBadgeClasses(status: ReservationStatus): string {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'confirmed':
        return 'bg-emerald-500/10 border-emerald-500/30 text-text-primary hover:border-emerald-500';
      case 'seated':
        return 'bg-amber-500/10 border-amber-500/30 text-text-primary hover:border-amber-500';
      case 'cancelled':
        return 'bg-red-500/10 border-red-500/30 text-text-muted hover:border-red-500 opacity-60';
      default:
        return 'bg-blue-500/10 border-blue-500/30 text-text-primary hover:border-blue-500';
    }
  }

  getStatusPillClasses(status: ReservationStatus): string {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'confirmed':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
      case 'seated':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
    }
  }

  getInitials(name: string): string {
    if (!name) return 'G';
    const parts = name.trim().split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  selectBooking(res: Reservation): void {
    // Quick focus or action
  }

  openNewBookingDrawer(): void {
    this.formData = {
      customerName: '',
      customerPhone: '',
      guestsCount: 2,
      date: new Date().toISOString().slice(0, 10),
      time: '19:00',
      section: 'Main Floor',
      tableNumber: 'T-01',
      occasion: '',
      specialRequests: '',
      status: 'confirmed',
    };
    this.showDrawer.set(true);
  }

  async saveReservation(): Promise<void> {
    const ok = await this.reservationsService.createReservation(this.formData);
    if (ok.success) {
      this.showDrawer.set(false);
    }
  }

  async changeStatus(booking: Reservation, status: ReservationStatus): Promise<void> {
    const id = booking.id || booking._id;
    if (id) {
      await this.reservationsService.updateStatus(id, status);
    }
  }
}
