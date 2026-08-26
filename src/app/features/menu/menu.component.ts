import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
﻿import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EgpCurrencyPipe } from '../../shared/pipes/egyptian-currency.pipe';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, EgpCurrencyPipe, SearchInputComponent, AppIconComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-text-primary tracking-tight">Menu & Categories</h1>
          <p class="text-xs text-text-muted mt-0.5">Manage digital QR catalog, pricing, variants, and item availability</p>
        </div>

        <div class="flex items-center gap-3">
          <div class="w-64">
            <app-search-input placeholder="Search dishes..."></app-search-input>
          </div>
          <button class="px-4 py-2 rounded-md bg-[#FF6B00] hover:bg-[#E55F00] text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 self-start cursor-pointer">
            <app-icon name="plus" customClass="w-4 h-4"></app-icon>
            <span>Add New Dish</span>
          </button>
        </div>
      </div>

      <!-- Categories & Items Table / Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        @for (item of items(); track item.id) {
          <div class="bg-surface rounded-lg border border-border p-5 shadow-card hover:border-[#FF6B00]/40 transition flex items-start justify-between">
            <div class="flex items-start gap-3.5">
              <div class="text-3xl p-2.5 rounded-lg bg-surface-container border border-border">
                {{ item.emoji }}
              </div>
              <div>
                <h3 class="text-sm font-bold text-text-primary">{{ item.name }}</h3>
                <span class="text-xs font-semibold text-[#FF6B00] block">{{ item.category }}</span>
                <span class="text-xs text-text-muted line-clamp-1 mt-0.5">{{ item.desc }}</span>
                <div class="mt-3 font-black text-sm text-text-primary">{{ item.price | egpCurrency }}</div>
              </div>
            </div>

            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" [ngClass]="item.available ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/30'">
              {{ item.available ? 'AVAILABLE' : 'SOLD OUT' }}
            </span>
          </div>
        }
      </div>
    </div>
  `,
})
export default class MenuComponent {
  readonly items = signal([
    { id: '1', name: 'Double Bacon Smash', category: 'Burgers', desc: 'Angus beef, cheddar, crispy beef bacon', price: 210, emoji: '🍔', available: true },
    { id: '2', name: 'Classic Truffle Burger', category: 'Burgers', desc: 'Black truffle aioli, sautéed mushrooms', price: 240, emoji: '🍔', available: true },
    { id: '3', name: 'Wood-Fired Margherita', category: 'Pizzas', desc: 'San Marzano tomato, fresh buffalo mozzarella', price: 190, emoji: '🍕', available: true },
    { id: '4', name: 'Truffle Fries', category: 'Sides', desc: 'Parmesan shavings, parsley, truffle oil', price: 95, emoji: '🍟', available: true },
    { id: '5', name: 'Lotus Molten Cake', category: 'Desserts', desc: 'Warm molten center with vanilla gelato', price: 140, emoji: '🍰', available: false },
  ]);
}

