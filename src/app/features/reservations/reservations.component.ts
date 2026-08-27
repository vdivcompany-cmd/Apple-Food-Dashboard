import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationsService, isValidEgyptianPhone, formatEgyptianPhoneForBackend } from './reservations.service';
import { Reservation, ReservationStatus } from '../../shared/models/reservation.model';
import { RestaurantTable } from '../../shared/models/table.model';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    <div class="space-y-6 select-none animate-[fadeIn_0.3s_ease-out]">
      
      <!-- ── TOP ACTION BAR ───────────────────────────────── -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-border shadow-xs">
        <div class="flex flex-wrap items-center gap-3">
          <div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
              Reservations Board
            </h1>
            <p class="text-xs text-text-muted mt-0.5">
              Live dining reservations synced with floor plan tables & seating capacities
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
            <div class="text-center">Main Dining</div>
            <div class="text-center">Patio</div>
            <div class="text-center">Bar</div>
            <div class="text-center">VIP Lounge</div>
          </div>

          <!-- Timeline Time Grid -->
          <div class="divide-y divide-border overflow-y-auto max-h-[700px]">
            @for (slot of timeSlots; track slot) {
              <div class="grid grid-cols-5 min-h-[72px] hover:bg-surface-hover/50 transition">
                
                <!-- Time Column -->
                <div class="p-3 border-r border-border flex items-center justify-center bg-surface-container/30">
                  <span class="text-xs font-black text-text-muted">{{ slot }}</span>
                </div>

                <!-- Zone: Main Dining -->
                <div class="p-1.5 border-r border-border flex flex-col justify-center gap-1 min-h-[64px]">
                  @for (booking of getReservationsForSlotAndZone(slot, 'Main Dining'); track booking._id || booking.id) {
                    <div
                      (click)="selectBooking(booking)"
                      [ngClass]="getBookingBadgeClasses(booking.status)"
                      class="p-2 rounded-xl border text-[11px] font-bold transition shadow-xs cursor-pointer"
                    >
                      <div class="flex items-center justify-between">
                        <span class="truncate font-black">{{ booking.customerName }}</span>
                        <span class="text-[9px] px-1.5 py-0.2 rounded-full font-extrabold uppercase">
                          {{ booking.guestsCount }}p
                        </span>
                      </div>
                      <div class="text-[9px] text-text-muted flex items-center justify-between mt-0.5">
                        <span>{{ booking.tableNumber }}</span>
                        <span class="capitalize">{{ booking.status }}</span>
                      </div>
                    </div>
                  }
                </div>

                <!-- Zone: Patio -->
                <div class="p-1.5 border-r border-border flex flex-col justify-center gap-1 min-h-[64px]">
                  @for (booking of getReservationsForSlotAndZone(slot, 'Patio'); track booking._id || booking.id) {
                    <div
                      (click)="selectBooking(booking)"
                      [ngClass]="getBookingBadgeClasses(booking.status)"
                      class="p-2 rounded-xl border text-[11px] font-bold transition shadow-xs cursor-pointer"
                    >
                      <div class="flex items-center justify-between">
                        <span class="truncate font-black">{{ booking.customerName }}</span>
                        <span class="text-[9px] px-1.5 py-0.2 rounded-full font-extrabold uppercase">
                          {{ booking.guestsCount }}p
                        </span>
                      </div>
                      <div class="text-[9px] text-text-muted flex items-center justify-between mt-0.5">
                        <span>{{ booking.tableNumber }}</span>
                        <span class="capitalize">{{ booking.status }}</span>
                      </div>
                    </div>
                  }
                </div>

                <!-- Zone: Bar -->
                <div class="p-1.5 border-r border-border flex flex-col justify-center gap-1 min-h-[64px]">
                  @for (booking of getReservationsForSlotAndZone(slot, 'Bar'); track booking._id || booking.id) {
                    <div
                      (click)="selectBooking(booking)"
                      [ngClass]="getBookingBadgeClasses(booking.status)"
                      class="p-2 rounded-xl border text-[11px] font-bold transition shadow-xs cursor-pointer"
                    >
                      <div class="flex items-center justify-between">
                        <span class="truncate font-black">{{ booking.customerName }}</span>
                        <span class="text-[9px] px-1.5 py-0.2 rounded-full font-extrabold uppercase">
                          {{ booking.guestsCount }}p
                        </span>
                      </div>
                      <div class="text-[9px] text-text-muted flex items-center justify-between mt-0.5">
                        <span>{{ booking.tableNumber }}</span>
                        <span class="capitalize">{{ booking.status }}</span>
                      </div>
                    </div>
                  }
                </div>

                <!-- Zone: VIP Lounge -->
                <div class="p-1.5 flex flex-col justify-center gap-1 min-h-[64px]">
                  @for (booking of getReservationsForSlotAndZone(slot, 'VIP Lounge'); track booking._id || booking.id) {
                    <div
                      (click)="selectBooking(booking)"
                      [ngClass]="getBookingBadgeClasses(booking.status)"
                      class="p-2 rounded-xl border text-[11px] font-bold transition shadow-xs cursor-pointer"
                    >
                      <div class="flex items-center justify-between">
                        <span class="truncate font-black">{{ booking.customerName }}</span>
                        <span class="text-[9px] px-1.5 py-0.2 rounded-full font-extrabold uppercase">
                          {{ booking.guestsCount }}p
                        </span>
                      </div>
                      <div class="text-[9px] text-text-muted flex items-center justify-between mt-0.5">
                        <span>{{ booking.tableNumber }}</span>
                        <span class="capitalize">{{ booking.status }}</span>
                      </div>
                    </div>
                  }
                </div>

              </div>
            }
          </div>

        </div>

        <!-- ── 2. RIGHT: BOOKINGS FEED (xl:col-span-4) ──────── -->
        <div class="xl:col-span-4 bg-surface rounded-2xl border border-border shadow-card p-5 flex flex-col justify-between">
          
          <div class="space-y-4">
            <!-- Header -->
            <div class="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 class="text-base font-extrabold text-text-primary">
                  Bookings Schedule
                </h3>
                <span class="text-xs text-text-muted">
                  {{ filteredBookings().length }} reservations on file
                </span>
              </div>
              <span class="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-xl">
                {{ selectedDateFilter() | uppercase }}
              </span>
            </div>

            <!-- Loading State -->
            @if (reservationsService.isLoading()) {
              <div class="p-12 flex flex-col items-center justify-center gap-2 text-text-muted">
                <app-icon name="refresh-cw" customClass="w-6 h-6 text-primary animate-spin"></app-icon>
                <span class="text-xs font-bold">Syncing reservations with backend...</span>
              </div>
            } @else if (filteredBookings().length === 0) {
              <!-- Empty State -->
              <div class="p-8 text-center bg-surface-container/40 rounded-2xl border border-dashed border-border space-y-2">
                <app-icon name="calendar" customClass="w-8 h-8 text-text-muted mx-auto"></app-icon>
                <h4 class="text-xs font-extrabold text-text-primary">No Bookings Found</h4>
                <p class="text-[11px] text-text-muted">No reservations scheduled for this date filter.</p>
                <button
                  type="button"
                  (click)="openNewBookingDrawer()"
                  class="mt-2 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition cursor-pointer"
                >
                  + Add Booking
                </button>
              </div>
            } @else {
              <!-- Bookings List -->
              <div class="space-y-3 overflow-y-auto max-h-[580px] pr-1">
                @for (res of filteredBookings(); track res._id || res.id) {
                  <div class="p-4 bg-surface-container rounded-2xl border border-border space-y-3 hover:border-primary/40 transition">
                    
                    <div class="flex items-start justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center font-black text-xs text-text-primary shadow-xs">
                          {{ getInitials(res.customerName) }}
                        </div>
                        <div>
                          <h4 class="text-xs font-extrabold text-text-primary">{{ res.customerName }}</h4>
                          <span class="text-[11px] text-text-muted">{{ res.customerPhone }}</span>
                        </div>
                      </div>
                      <span
                        class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border"
                        [ngClass]="getStatusPillClasses(res.status)"
                      >
                        {{ res.status }}
                      </span>
                    </div>

                    <!-- Meta Tags -->
                    <div class="grid grid-cols-2 gap-2 text-[11px] font-bold text-text-muted pt-2 border-t border-border/60">
                      <div class="flex items-center gap-1.5">
                        <app-icon name="clock" customClass="w-3.5 h-3.5 text-primary"></app-icon>
                        <span class="text-text-primary">{{ res.time }} - {{ res.endTime }}</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <app-icon name="users" customClass="w-3.5 h-3.5 text-blue-500"></app-icon>
                        <span class="text-text-primary">{{ res.guestsCount }} Guests</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <app-icon name="map-pin" customClass="w-3.5 h-3.5 text-amber-500"></app-icon>
                        <span class="text-text-primary">{{ res.section }}</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <app-icon name="sparkles" customClass="w-3.5 h-3.5 text-purple-500"></app-icon>
                        <span class="text-text-primary">{{ res.tableNumber || 'Table Assigned' }}</span>
                      </div>
                    </div>

                    @if (res.notes || res.occasion || res.specialRequests) {
                      <div class="p-2 bg-surface rounded-xl border border-border text-[10px] text-text-secondary font-medium italic">
                        "{{ res.notes || res.occasion || res.specialRequests }}"
                      </div>
                    }

                    <!-- Actions -->
                    <div class="flex items-center gap-2 pt-2 border-t border-border/60">
                      @if (res.status === 'pending' || res.status === 'PENDING') {
                        <button
                          type="button"
                          (click)="changeStatus(res, 'confirmed')"
                          class="flex-1 py-1.5 bg-emerald-500 text-white rounded-xl text-[11px] font-extrabold hover:bg-emerald-600 transition cursor-pointer"
                        >
                          Confirm
                        </button>
                      }
                      @if (res.status !== 'seated' && res.status !== 'SEATED' && res.status !== 'cancelled' && res.status !== 'CANCELLED') {
                        <button
                          type="button"
                          (click)="changeStatus(res, 'seated')"
                          class="flex-1 py-1.5 bg-amber-500 text-white rounded-xl text-[11px] font-extrabold hover:bg-amber-600 transition cursor-pointer"
                        >
                          Seat Guests
                        </button>
                      }
                      @if (res.status !== 'cancelled' && res.status !== 'CANCELLED') {
                        <button
                          type="button"
                          (click)="changeStatus(res, 'cancelled')"
                          class="px-3 py-1.5 bg-surface hover:bg-red-500/10 text-red-500 rounded-xl text-[11px] font-bold border border-border hover:border-red-500/20 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      }
                      <button
                        type="button"
                        (click)="deleteBooking(res)"
                        class="p-1.5 text-text-muted hover:text-red-500 hover:bg-surface rounded-xl transition cursor-pointer"
                        title="Delete booking"
                      >
                        <app-icon name="trash-2" customClass="w-3.5 h-3.5"></app-icon>
                      </button>
                    </div>

                  </div>
                }
              </div>
            }

          </div>

        </div>

      </div>

      <!-- ── SLIDE-IN NEW BOOKING DRAWER ───────────────────── -->
      @if (showDrawer()) {
        <div class="fixed inset-0 z-50 overflow-hidden">
          <div (click)="showDrawer.set(false)" class="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"></div>

          <div class="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div class="w-screen max-w-md bg-surface border-l border-border shadow-2xl flex flex-col animate-slide-in-right">
              
              <!-- Drawer Header -->
              <div class="p-6 border-b border-border flex items-center justify-between bg-surface-container/50">
                <div>
                  <h3 class="text-base font-extrabold text-text-primary">Create Reservation</h3>
                  <p class="text-xs text-text-muted">Register dining booking with Egyptian phone & capacity validation</p>
                </div>
                <button
                  type="button"
                  (click)="showDrawer.set(false)"
                  class="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-container transition cursor-pointer"
                >
                  <app-icon name="x" customClass="w-5 h-5"></app-icon>
                </button>
              </div>

              <!-- Drawer Form Body -->
              <div class="p-6 space-y-4 flex-1 overflow-y-auto text-xs">
                
                <!-- Guest Name -->
                <div>
                  <label class="block font-bold text-text-primary mb-1">Guest Full Name *</label>
                  <input
                    type="text"
                    [ngModel]="customerName()"
                    (ngModelChange)="customerName.set($event)"
                    placeholder="e.g. Tarek Nour"
                    class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition"
                  />
                </div>

                <!-- Egyptian Phone Number Input with Real-time Validation -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block font-bold text-text-primary">Egyptian Phone Number *</label>
                    <span class="text-[10px] text-text-muted font-medium">Egypt (+20 / 01x)</span>
                  </div>
                  <div class="relative">
                    <input
                      type="tel"
                      [ngModel]="customerPhone()"
                      (ngModelChange)="customerPhone.set($event)"
                      placeholder="01012345678"
                      [ngClass]="phoneEntered() && !isPhoneValid() ? 'border-red-500 focus:border-red-500 bg-red-500/5' : 'border-border focus:border-primary bg-surface-container'"
                      class="w-full px-3.5 py-2.5 border rounded-xl text-text-primary font-semibold focus:outline-none transition"
                    />
                    @if (phoneEntered() && isPhoneValid()) {
                      <app-icon name="check-circle" customClass="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2"></app-icon>
                    }
                  </div>
                  
                  @if (phoneEntered() && !isPhoneValid()) {
                    <p class="text-[11px] text-red-500 font-bold mt-1.5 flex items-center gap-1 animate-fade-in">
                      <app-icon name="alert-triangle" customClass="w-3.5 h-3.5 shrink-0"></app-icon>
                      <span>Please enter a valid 11-digit Egyptian mobile number (010, 011, 012, 015).</span>
                    </p>
                  }
                </div>

                <!-- Dining Table Selection -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block font-bold text-text-primary">Assigned Dining Table</label>
                    @if (selectedTable()) {
                      <span class="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        Max Capacity: {{ selectedTable()?.capacity }} Guests
                      </span>
                    }
                  </div>
                  <select
                    [ngModel]="selectedTableId()"
                    (ngModelChange)="onTableSelect($event)"
                    class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-bold focus:outline-none focus:border-primary transition cursor-pointer"
                  >
                    <option value="">Auto-assign / Any Table</option>
                    @for (t of reservationsService.tables(); track t._id || t.id) {
                      <option [value]="t._id || t.id">
                        Table {{ t.tableNumber }} • Capacity: {{ t.capacity }} Guests ({{ t.section || 'Main Dining' }})
                      </option>
                    }
                  </select>
                </div>

                <!-- Party Size (Guests) with Capacity Warning -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-text-primary mb-1">Party Size (Guests) *</label>
                    <input
                      type="number"
                      [ngModel]="guestsCount()"
                      (ngModelChange)="guestsCount.set(+$event)"
                      min="1"
                      [max]="selectedTable()?.capacity || 20"
                      [ngClass]="isOverCapacity() ? 'border-red-500 focus:border-red-500 bg-red-500/5' : 'border-border focus:border-primary bg-surface-container'"
                      class="w-full px-3.5 py-2.5 border rounded-xl text-text-primary font-bold focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label class="block font-bold text-text-primary mb-1">Time Slot *</label>
                    <select
                      [ngModel]="reservationTime()"
                      (ngModelChange)="reservationTime.set($event)"
                      class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition cursor-pointer"
                    >
                      @for (slot of timeSlots; track slot) {
                        <option [value]="slot">{{ slot }}</option>
                      }
                    </select>
                  </div>
                </div>

                <!-- Over-Capacity Warning Banner -->
                @if (isOverCapacity()) {
                  <div class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 space-y-1 animate-shake">
                    <div class="flex items-center gap-1.5 font-extrabold text-[11px]">
                      <app-icon name="alert-triangle" customClass="w-4 h-4 text-red-500 shrink-0"></app-icon>
                      <span>Table Capacity Exceeded!</span>
                    </div>
                    <p class="text-[10px] leading-relaxed">
                      Table {{ selectedTable()?.tableNumber }} can only seat up to <strong>{{ selectedTable()?.capacity }} guests</strong>, but <strong>{{ guestsCount() }} guests</strong> were requested. Please select a larger table or reduce party size.
                    </p>
                  </div>
                }

                <div>
                  <label class="block font-bold text-text-primary mb-1">Reservation Date *</label>
                  <input
                    type="date"
                    [ngModel]="reservationDate()"
                    (ngModelChange)="reservationDate.set($event)"
                    class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition cursor-pointer"
                  />
                </div>

                <div>
                  <label class="block font-bold text-text-primary mb-1">Occasion / VIP Notes</label>
                  <input
                    type="text"
                    [ngModel]="notes()"
                    (ngModelChange)="notes.set($event)"
                    placeholder="e.g. Anniversary Dinner, Birthday celebration, Quiet booth"
                    class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary transition"
                  />
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
                  [disabled]="isSubmitDisabled()"
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

  readonly selectedDateFilter = signal<'today' | 'tomorrow' | 'all'>('all');
  readonly showDrawer = signal<boolean>(false);

  // Pure Angular 22 Signals for full form reactivity
  readonly customerName = signal<string>('');
  readonly customerPhone = signal<string>('');
  readonly guestsCount = signal<number>(2);
  readonly reservationDate = signal<string>(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  readonly reservationTime = signal<string>('19:30');
  readonly selectedTableId = signal<string>('');
  readonly notes = signal<string>('');

  readonly timeSlots = [
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
  ];

  readonly filteredBookings = computed(() => {
    const list = this.reservationsService.reservations();
    const filter = this.selectedDateFilter();
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    if (filter === 'today') {
      return list.filter((r) => r.date?.startsWith(today));
    }
    if (filter === 'tomorrow') {
      return list.filter((r) => r.date?.startsWith(tomorrow));
    }
    return list;
  });

  readonly selectedTable = computed(() => {
    const id = this.selectedTableId();
    if (!id) return null;
    return this.reservationsService.tables().find((t) => (t._id || t.id) === id) || null;
  });

  readonly isOverCapacity = computed(() => {
    const table = this.selectedTable();
    if (!table || !table.capacity) return false;
    const guests = Number(this.guestsCount()) || 1;
    return guests > table.capacity;
  });

  readonly phoneEntered = computed(() => {
    return this.customerPhone().trim().length > 0;
  });

  readonly isPhoneValid = computed(() => {
    return isValidEgyptianPhone(this.customerPhone());
  });

  readonly isSubmitDisabled = computed(() => {
    const isSaving = this.reservationsService.isSaving();
    const name = this.customerName().trim();
    const phone = this.customerPhone().trim();
    const validPhone = this.isPhoneValid();
    const overCap = this.isOverCapacity();

    return isSaving || !name || !phone || !validPhone || overCap;
  });

  ngOnInit(): void {
    this.reservationsService.fetchTables();
    this.reservationsService.fetchReservations();
  }

  onTableSelect(tableId: string): void {
    this.selectedTableId.set(tableId);
  }

  getReservationsForSlotAndZone(slot: string, zone: string): Reservation[] {
    return this.filteredBookings().filter((r) => {
      const slotMatch = (r.time || '').startsWith(slot) || (r.time || '').replace(':', '') === slot.replace(':', '');
      const rZone = (r.section || r.zone || 'Main Dining').toLowerCase();
      const targetZone = zone.toLowerCase();
      
      const zoneMatch =
        rZone === targetZone ||
        (targetZone.includes('main') && rZone.includes('main')) ||
        (targetZone.includes('patio') && rZone.includes('patio')) ||
        (targetZone.includes('bar') && rZone.includes('bar')) ||
        (targetZone.includes('vip') && rZone.includes('vip'));

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
    // Selection focus
  }

  openNewBookingDrawer(): void {
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const tablesList = this.reservationsService.tables();

    this.customerName.set('');
    this.customerPhone.set('');
    this.guestsCount.set(2);
    this.reservationDate.set(tomorrowStr);
    this.reservationTime.set('19:30');
    this.notes.set('');

    if (tablesList.length > 0) {
      this.selectedTableId.set(tablesList[0]._id || tablesList[0].id || '');
    } else {
      this.selectedTableId.set('');
    }

    this.showDrawer.set(true);
  }

  async saveReservation(): Promise<void> {
    const name = this.customerName().trim();
    const phone = this.customerPhone().trim();

    if (!name || !phone) return;

    if (!this.isPhoneValid()) {
      alert('Please enter a valid Egyptian mobile phone number (e.g. 01012345678, 011..., 012..., 015...).');
      return;
    }

    if (this.isOverCapacity()) {
      const table = this.selectedTable();
      alert(`Party size (${this.guestsCount()}) exceeds Table ${table?.tableNumber} maximum capacity of ${table?.capacity} guests.`);
      return;
    }

    const payload: Partial<Reservation> = {
      customerName: name,
      customerPhone: phone,
      guestsCount: Number(this.guestsCount()) || 2,
      partySize: Number(this.guestsCount()) || 2,
      date: this.reservationDate(),
      time: this.reservationTime(),
      tableId: this.selectedTableId() || undefined,
      notes: this.notes().trim() || undefined,
      status: 'confirmed',
    };

    const ok = await this.reservationsService.createReservation(payload);
    if (ok.success) {
      this.showDrawer.set(false);
    } else if (ok.error) {
      alert(ok.error);
    }
  }

  async changeStatus(booking: Reservation, status: ReservationStatus): Promise<void> {
    const id = booking.id || booking._id;
    if (id) {
      await this.reservationsService.updateStatus(id, status);
    }
  }

  async deleteBooking(booking: Reservation): Promise<void> {
    const id = booking.id || booking._id;
    if (!id) return;
    const confirmed = confirm(`Are you sure you want to cancel booking for ${booking.customerName}?`);
    if (confirmed) {
      await this.reservationsService.deleteReservation(id);
    }
  }
}
