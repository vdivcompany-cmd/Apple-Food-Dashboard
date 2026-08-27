import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService } from './menu.service';
import { MenuItem, Category } from '../../shared/models/menu.model';
import { EgpCurrencyPipe } from '../../shared/pipes/egyptian-currency.pipe';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, EgpCurrencyPipe, AppIconComponent],
  template: `
    <div class="space-y-6 select-none animate-[fadeIn_0.3s_ease-out]">
      
      <!-- ── TOP ACTION BAR (Stitch Layout) ───────────────── -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-border shadow-xs">
        <div class="flex items-center gap-3 flex-1">
          <!-- Search Bar -->
          <div class="relative w-full max-w-md">
            <app-icon name="search" customClass="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"></app-icon>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search menu items by name, category, or ingredients..."
              class="w-full pl-10 pr-9 py-2 bg-surface-container border border-border rounded-xl text-xs font-semibold text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition"
            />
            @if (searchQuery()) {
              <button
                type="button"
                (click)="searchQuery.set('')"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
              >
                <app-icon name="x" customClass="w-3.5 h-3.5"></app-icon>
              </button>
            }
          </div>

          <!-- Sort Filter Button -->
          <button
            type="button"
            (click)="toggleSort()"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container border border-border hover:bg-surface-hover text-text-primary text-xs font-bold transition cursor-pointer"
            [title]="'Sort: ' + sortBy()"
          >
            <app-icon name="sort" customClass="w-3.5 h-3.5 text-text-muted"></app-icon>
            <span class="hidden md:inline capitalize">{{ sortBy() }}</span>
          </button>
        </div>

        <!-- Add Product CTA -->
        <button
          type="button"
          (click)="openAddDrawer()"
          class="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-extrabold shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer"
        >
          <app-icon name="plus" customClass="w-4 h-4"></app-icon>
          <span>Add Product</span>
        </button>
      </div>

      <!-- ── MAIN CONTENT: SPLIT LAYOUT (Category Sidebar + Product Grid) ── -->
      <div class="flex flex-col lg:flex-row gap-6 min-h-[640px]">
        
        <!-- ── LEFT CATEGORIES SIDEBAR (w-64) ───────────────── -->
        <div class="w-full lg:w-64 flex flex-col bg-surface rounded-2xl border border-border shadow-card overflow-hidden flex-shrink-0">
          
          <div class="p-4 border-b border-border bg-surface-container/50 flex justify-between items-center">
            <h2 class="text-sm font-extrabold text-text-primary">Categories</h2>
            <button
              type="button"
              (click)="showNewCategoryModal.set(true)"
              class="text-primary hover:text-primary-hover transition flex items-center gap-1 text-xs font-bold cursor-pointer"
              title="Add Category"
            >
              <app-icon name="plus-circle" customClass="w-4 h-4"></app-icon>
              <span>New</span>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-2 space-y-1">
            <!-- 'All' Tab -->
            <button
              type="button"
              (click)="selectedCategory.set('all')"
              class="w-full flex items-center justify-between p-3 rounded-xl transition-all relative overflow-hidden group cursor-pointer text-left"
              [ngClass]="selectedCategory() === 'all' ? 'bg-primary/10 border-l-4 border-primary text-text-primary font-extrabold' : 'text-text-secondary hover:bg-surface-container font-semibold'"
            >
              <div class="flex items-center gap-3">
                <app-icon name="layers" [customClass]="selectedCategory() === 'all' ? 'w-4 h-4 text-primary' : 'w-4 h-4 text-text-muted'"></app-icon>
                <span class="text-xs">All Dishes</span>
              </div>
              <span class="bg-surface-container-highest px-2 py-0.5 rounded-lg text-[10px] font-bold text-text-muted">
                {{ menuService.items().length }}
              </span>
            </button>

            <!-- Dynamic Categories -->
            @for (cat of menuService.categories(); track cat.id || cat.name) {
              <button
                type="button"
                (click)="selectedCategory.set(cat.name)"
                class="w-full flex items-center justify-between p-3 rounded-xl transition-all relative overflow-hidden group cursor-pointer text-left"
                [ngClass]="selectedCategory() === cat.name ? 'bg-primary/10 border-l-4 border-primary text-text-primary font-extrabold' : 'text-text-secondary hover:bg-surface-container font-semibold'"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <app-icon [name]="getCategoryIcon(cat.name)" [customClass]="selectedCategory() === cat.name ? 'w-4 h-4 text-primary' : 'w-4 h-4 text-text-muted'"></app-icon>
                  <span class="text-xs truncate">{{ cat.name }}</span>
                </div>
                <span class="bg-surface-container-highest px-2 py-0.5 rounded-lg text-[10px] font-bold text-text-muted">
                  {{ getItemCountForCategory(cat.name) }}
                </span>
              </button>
            }
          </div>
        </div>

        <!-- ── RIGHT PRODUCTS GRID / LIST ────────────────────── -->
        <div class="flex-1 bg-surface rounded-2xl border border-border shadow-card p-5 flex flex-col">
          
          <!-- Category Header & View Toggles -->
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-lg font-extrabold text-text-primary tracking-tight capitalize">
                {{ selectedCategory() === 'all' ? 'All Menu Items' : selectedCategory() }}
              </h3>
              <p class="text-xs text-text-muted mt-0.5">
                {{ filteredProducts().length }} {{ filteredProducts().length === 1 ? 'dish' : 'dishes' }} available in this section
              </p>
            </div>

            <!-- Grid / List Switcher -->
            <div class="flex items-center bg-surface-container p-1 rounded-xl border border-border">
              <button
                type="button"
                (click)="viewMode.set('grid')"
                [ngClass]="viewMode() === 'grid' ? 'bg-surface text-primary shadow-xs font-bold' : 'text-text-muted hover:text-text-primary'"
                class="p-1.5 rounded-lg transition cursor-pointer"
                title="Grid View"
              >
                <app-icon name="grid-view" customClass="w-4 h-4"></app-icon>
              </button>
              <button
                type="button"
                (click)="viewMode.set('list')"
                [ngClass]="viewMode() === 'list' ? 'bg-surface text-primary shadow-xs font-bold' : 'text-text-muted hover:text-text-primary'"
                class="p-1.5 rounded-lg transition cursor-pointer"
                title="List View"
              >
                <app-icon name="list" customClass="w-4 h-4"></app-icon>
              </button>
            </div>
          </div>

          <!-- Loading State -->
          @if (menuService.isLoading()) {
            <div class="flex-1 flex flex-col items-center justify-center py-20 text-text-muted">
              <app-icon name="refresh-cw" customClass="w-8 h-8 animate-spin text-primary mb-3"></app-icon>
              <p class="text-xs font-bold text-text-primary">Loading digital menu catalog...</p>
            </div>
          } @else if (filteredProducts().length === 0) {
            <!-- Empty State -->
            <div class="flex-1 flex flex-col items-center justify-center py-20 text-center text-text-muted">
              <div class="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mb-3 border border-border text-text-muted">
                <app-icon name="chef-hat" customClass="w-7 h-7 opacity-40"></app-icon>
              </div>
              <h4 class="text-sm font-bold text-text-primary">No dishes found</h4>
              <p class="text-xs text-text-muted mt-1 max-w-xs">
                @if (searchQuery()) {
                  No dishes matched "{{ searchQuery() }}". Try a different query.
                } @else {
                  There are no items in this category yet. Click "Add Product" to create one.
                }
              </p>
            </div>
          } @else {

            <!-- ── 1. GRID VIEW ───────────────────────────────── -->
            @if (viewMode() === 'grid') {
              <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                @for (item of filteredProducts(); track item.id || item._id) {
                  <div class="group bg-surface-container/60 hover:bg-surface-container rounded-2xl border border-border hover:border-primary/40 transition-all flex flex-col overflow-hidden relative shadow-xs">
                    
                    <!-- Image Area -->
                    <div class="h-36 w-full relative overflow-hidden bg-surface-container-high flex items-center justify-center">
                      @if (item.imageUrl) {
                        <img
                          [src]="item.imageUrl"
                          [alt]="item.name"
                          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      } @else {
                        <div class="flex flex-col items-center justify-center text-text-muted">
                          <span class="text-4xl mb-1">{{ item.emoji || '🍽️' }}</span>
                        </div>
                      }

                      <!-- Tag Badges (Top Right) -->
                      <div class="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                        @if (item.isSpicy) {
                          <span class="bg-red-500/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs flex items-center gap-0.5">
                            <app-icon name="flame" customClass="w-3 h-3"></app-icon>
                            <span>Spicy</span>
                          </span>
                        }
                        @if (item.isVegetarian) {
                          <span class="bg-emerald-600/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs flex items-center gap-0.5">
                            <span>🌱 Veg</span>
                          </span>
                        }
                      </div>

                      <!-- Edit / Delete Floating Hover Actions -->
                      <div class="absolute top-2.5 left-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          (click)="openEditDrawer(item)"
                          class="p-1.5 bg-surface/90 hover:bg-surface text-text-primary rounded-lg shadow-sm border border-border transition cursor-pointer"
                          title="Edit Dish"
                        >
                          <app-icon name="pencil" customClass="w-3.5 h-3.5"></app-icon>
                        </button>
                        <button
                          type="button"
                          (click)="deleteItem(item)"
                          class="p-1.5 bg-surface/90 hover:bg-red-500 hover:text-white text-red-500 rounded-lg shadow-sm border border-border transition cursor-pointer"
                          title="Delete Dish"
                        >
                          <app-icon name="trash-2" customClass="w-3.5 h-3.5"></app-icon>
                        </button>
                      </div>
                    </div>

                    <!-- Item Details -->
                    <div class="p-4 flex flex-col flex-1 justify-between gap-3">
                      <div>
                        <div class="flex items-start justify-between gap-2">
                          <h4 class="text-xs font-extrabold text-text-primary group-hover:text-primary transition line-clamp-1">
                            {{ item.name }}
                          </h4>
                        </div>

                        <p class="text-[11px] text-text-muted line-clamp-2 mt-1 leading-relaxed">
                          {{ item.description || item.descriptionAr || 'No description provided' }}
                        </p>
                      </div>

                      <div class="pt-2 border-t border-border/60 flex items-center justify-between">
                        <!-- Price -->
                        <div>
                          <span class="text-xs font-black text-text-primary">
                            {{ item.price | egpCurrency }}
                          </span>
                          @if (item.preparationTimeMinutes) {
                            <span class="text-[10px] text-text-muted block">
                              ⏱️ {{ item.preparationTimeMinutes }}m prep
                            </span>
                          }
                        </div>

                        <!-- 86 / In Stock Toggle Switch -->
                        <div class="flex items-center gap-1.5">
                          <span class="text-[10px] font-bold" [ngClass]="item.isAvailable !== false ? 'text-emerald-500' : 'text-red-500'">
                            {{ item.isAvailable !== false ? 'Active' : '86 Out' }}
                          </span>
                          <button
                            type="button"
                            (click)="toggleAvailability(item)"
                            class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                            [ngClass]="item.isAvailable !== false ? 'bg-emerald-500' : 'bg-surface-container-highest'"
                          >
                            <span
                              class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out"
                              [ngClass]="item.isAvailable !== false ? 'translate-x-4' : 'translate-x-0'"
                            ></span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                }
              </div>
            } @else {

              <!-- ── 2. LIST VIEW ───────────────────────────────── -->
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="border-b border-border text-text-muted uppercase text-[10px] font-extrabold tracking-wider">
                    <tr>
                      <th class="py-3 px-3">Item</th>
                      <th class="py-3 px-3">Category</th>
                      <th class="py-3 px-3">Price</th>
                      <th class="py-3 px-3">Prep Time</th>
                      <th class="py-3 px-3">Status</th>
                      <th class="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border">
                    @for (item of filteredProducts(); track item.id || item._id) {
                      <tr class="hover:bg-surface-container/50 transition">
                        <td class="py-3 px-3">
                          <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-lg overflow-hidden border border-border">
                              @if (item.imageUrl) {
                                <img [src]="item.imageUrl" [alt]="item.name" class="w-full h-full object-cover" />
                              } @else {
                                <span>{{ item.emoji || '🍽️' }}</span>
                              }
                            </div>
                            <div>
                              <div class="font-extrabold text-text-primary">{{ item.name }}</div>
                              <div class="text-[10px] text-text-muted truncate max-w-xs">{{ item.description }}</div>
                            </div>
                          </div>
                        </td>
                        <td class="py-3 px-3 font-semibold text-text-secondary">
                          {{ item.categoryName || item.category || 'General' }}
                        </td>
                        <td class="py-3 px-3 font-black text-text-primary">
                          {{ item.price | egpCurrency }}
                        </td>
                        <td class="py-3 px-3 text-text-muted">
                          {{ item.preparationTimeMinutes || 15 }} mins
                        </td>
                        <td class="py-3 px-3">
                          <button
                            type="button"
                            (click)="toggleAvailability(item)"
                            class="px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer inline-flex items-center gap-1"
                            [ngClass]="item.isAvailable !== false ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'"
                          >
                            <span class="w-1.5 h-1.5 rounded-full" [ngClass]="item.isAvailable !== false ? 'bg-emerald-500' : 'bg-red-500'"></span>
                            <span>{{ item.isAvailable !== false ? 'In Stock' : '86 Out' }}</span>
                          </button>
                        </td>
                        <td class="py-3 px-3 text-right">
                          <div class="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              (click)="openEditDrawer(item)"
                              class="p-1.5 rounded-lg bg-surface-container hover:bg-surface-hover text-text-primary transition cursor-pointer"
                              title="Edit"
                            >
                              <app-icon name="pencil" customClass="w-3.5 h-3.5"></app-icon>
                            </button>
                            <button
                              type="button"
                              (click)="deleteItem(item)"
                              class="p-1.5 rounded-lg bg-surface-container hover:bg-red-500/10 text-red-500 transition cursor-pointer"
                              title="Delete"
                            >
                              <app-icon name="trash-2" customClass="w-3.5 h-3.5"></app-icon>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

            }

          }

        </div>
      </div>

      <!-- ── SLIDE-IN ADD / EDIT PRODUCT DRAWER ─────────────── -->
      @if (showDrawer()) {
        <div class="fixed inset-0 z-50 overflow-hidden">
          <!-- Backdrop -->
          <div
            (click)="showDrawer.set(false)"
            class="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          ></div>

          <div class="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div class="w-screen max-w-md bg-surface border-l border-border shadow-2xl flex flex-col justify-between animate-slide-in">
              
              <!-- Drawer Header -->
              <div class="p-6 border-b border-border flex items-center justify-between bg-surface-container/50">
                <div>
                  <h3 class="text-base font-extrabold text-text-primary">
                    {{ editingItem() ? 'Edit Menu Product' : 'Add New Product' }}
                  </h3>
                  <p class="text-xs text-text-muted mt-0.5">
                    Fill in item parameters, pricing, and tags
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
                <!-- Name EN -->
                <div>
                  <label class="block font-bold text-text-primary mb-1">Product Title (English) *</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.name"
                    placeholder="e.g. Double Bacon Smash Burger"
                    class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition"
                  />
                </div>

                <!-- Name AR -->
                <div>
                  <label class="block font-bold text-text-primary mb-1">Title (Arabic)</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.nameAr"
                    placeholder="e.g. برجر بيكون دبل سماش"
                    dir="rtl"
                    class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition"
                  />
                </div>

                <!-- Category -->
                <div>
                  <label class="block font-bold text-text-primary mb-1">Category *</label>
                  <select
                    [(ngModel)]="formData.category"
                    class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition cursor-pointer"
                  >
                    @for (cat of menuService.categories(); track cat.id || cat.name) {
                      <option [value]="cat.name">{{ cat.name }}</option>
                    }
                  </select>
                </div>

                <!-- Price & Prep Time -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-text-primary mb-1">Selling Price (EGP) *</label>
                    <input
                      type="number"
                      [(ngModel)]="formData.price"
                      min="0"
                      class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-bold focus:outline-none focus:border-primary transition"
                    />
                  </div>
                  <div>
                    <label class="block font-bold text-text-primary mb-1">Prep Time (mins)</label>
                    <input
                      type="number"
                      [(ngModel)]="formData.preparationTimeMinutes"
                      min="1"
                      class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-bold focus:outline-none focus:border-primary transition"
                    />
                  </div>
                </div>

                <!-- Description -->
                <div>
                  <label class="block font-bold text-text-primary mb-1">Description</label>
                  <textarea
                    [(ngModel)]="formData.description"
                    rows="3"
                    placeholder="Crispy angus beef patties, melted cheddar, smoky BBQ sauce..."
                    class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition"
                  ></textarea>
                </div>

                <!-- Image URL -->
                <div>
                  <label class="block font-bold text-text-primary mb-1">Image URL</label>
                  <input
                    type="url"
                    [(ngModel)]="formData.imageUrl"
                    placeholder="https://images.unsplash.com/photo-..."
                    class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary transition"
                  />
                </div>

                <!-- Toggles (Spicy, Veg, Available) -->
                <div class="p-4 bg-surface-container rounded-xl border border-border space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-text-primary">Spicy Dish (🌶️)</span>
                    <input
                      type="checkbox"
                      [(ngModel)]="formData.isSpicy"
                      class="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                    />
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-text-primary">Vegetarian (🌱)</span>
                    <input
                      type="checkbox"
                      [(ngModel)]="formData.isVegetarian"
                      class="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                    />
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-text-primary">Available for Orders</span>
                    <input
                      type="checkbox"
                      [(ngModel)]="formData.isAvailable"
                      class="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                    />
                  </div>
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
                  (click)="saveItem()"
                  [disabled]="menuService.isSaving() || !formData.name || !formData.price"
                  class="flex-1 py-3 rounded-xl bg-primary text-white font-extrabold text-xs shadow-md hover:opacity-90 active:scale-95 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  @if (menuService.isSaving()) {
                    <app-icon name="refresh-cw" customClass="w-3.5 h-3.5 animate-spin"></app-icon>
                    <span>Saving...</span>
                  } @else {
                    <span>{{ editingItem() ? 'Update Item' : 'Create Item' }}</span>
                  }
                </button>
              </div>

            </div>
          </div>
        </div>
      }

      <!-- ── NEW CATEGORY MODAL ─────────────────────────────── -->
      @if (showNewCategoryModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div (click)="showNewCategoryModal.set(false)" class="absolute inset-0 bg-black/60 backdrop-blur-xs"></div>
          <div class="relative bg-surface rounded-2xl border border-border p-6 shadow-2xl max-w-sm w-full space-y-4">
            <h3 class="text-sm font-extrabold text-text-primary">Create Menu Category</h3>
            <input
              type="text"
              [(ngModel)]="newCategoryName"
              placeholder="Category Name (e.g. Pasta, Beverages)"
              class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs text-text-primary font-semibold focus:outline-none focus:border-primary"
            />
            <div class="flex items-center gap-3 pt-2">
              <button
                type="button"
                (click)="showNewCategoryModal.set(false)"
                class="flex-1 py-2 rounded-xl bg-surface-container text-text-primary text-xs font-bold hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="saveCategory()"
                [disabled]="!newCategoryName"
                class="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-extrabold shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export default class MenuComponent implements OnInit {
  readonly menuService = inject(MenuService);

  readonly selectedCategory = signal<string>('all');
  readonly searchQuery = signal<string>('');
  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly sortBy = signal<'name' | 'price-asc' | 'price-desc'>('name');

  readonly showDrawer = signal<boolean>(false);
  readonly showNewCategoryModal = signal<boolean>(false);
  readonly editingItem = signal<MenuItem | null>(null);

  newCategoryName = '';

  formData: Partial<MenuItem> = {
    name: '',
    nameAr: '',
    category: 'General',
    price: 150,
    preparationTimeMinutes: 15,
    description: '',
    imageUrl: '',
    isSpicy: false,
    isVegetarian: false,
    isAvailable: true,
  };

  readonly filteredProducts = computed(() => {
    let list = this.menuService.items();
    const cat = this.selectedCategory();
    const q = this.searchQuery().trim().toLowerCase();
    const sort = this.sortBy();

    // 1. Category Filter
    if (cat !== 'all') {
      list = list.filter(
        (i) =>
          (i.categoryName && i.categoryName.trim().toLowerCase() === cat.trim().toLowerCase()) ||
          (i.category && i.category.trim().toLowerCase() === cat.trim().toLowerCase()) ||
          i.categoryId === cat
      );
    }

    // 2. Search Query Filter
    if (q) {
      list = list.filter(
        (i) =>
          (i.name && i.name.toLowerCase().includes(q)) ||
          (i.nameAr && i.nameAr.toLowerCase().includes(q)) ||
          (i.description && i.description.toLowerCase().includes(q))
      );
    }

    // 3. Sort
    return [...list].sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      return (a.name || '').localeCompare(b.name || '');
    });
  });

  ngOnInit(): void {
    this.menuService.fetchCatalog();
  }

  getItemCountForCategory(catName: string): number {
    return this.menuService.items().filter(
      (i) =>
        (i.categoryName && i.categoryName.trim().toLowerCase() === catName.trim().toLowerCase()) ||
        (i.category && i.category.trim().toLowerCase() === catName.trim().toLowerCase()) ||
        i.categoryId === catName
    ).length;
  }

  getCategoryIcon(catName: string): string {
    const lower = (catName || '').toLowerCase();
    if (lower.includes('appetizer') || lower.includes('starter') || lower.includes('tapas') || lower.includes('سلط')) return 'tapas';
    if (lower.includes('main') || lower.includes('burger') || lower.includes('grill') || lower.includes('meat') || lower.includes('بيتزا')) return 'utensils';
    if (lower.includes('dessert') || lower.includes('sweet') || lower.includes('cake') || lower.includes('حلو')) return 'icecream';
    if (lower.includes('drink') || lower.includes('beverage') || lower.includes('bar') || lower.includes('مشروب')) return 'wine';
    if (lower.includes('coffee') || lower.includes('tea') || lower.includes('قهوة')) return 'coffee';
    if (lower.includes('special') || lower.includes('chef') || lower.includes('صيام')) return 'sparkles';
    return 'tag';
  }

  toggleSort(): void {
    const current = this.sortBy();
    if (current === 'name') this.sortBy.set('price-asc');
    else if (current === 'price-asc') this.sortBy.set('price-desc');
    else this.sortBy.set('name');
  }

  toggleAvailability(item: MenuItem): void {
    const id = item.id || item._id;
    if (id) {
      this.menuService.toggleAvailability(id, item.isAvailable !== false);
    }
  }

  openAddDrawer(): void {
    this.editingItem.set(null);
    const firstCat = this.menuService.categories()[0]?.name || 'Mains';
    this.formData = {
      name: '',
      nameAr: '',
      category: this.selectedCategory() !== 'all' ? this.selectedCategory() : firstCat,
      price: 150,
      preparationTimeMinutes: 15,
      description: '',
      imageUrl: '',
      isSpicy: false,
      isVegetarian: false,
      isAvailable: true,
    };
    this.showDrawer.set(true);
  }

  openEditDrawer(item: MenuItem): void {
    this.editingItem.set(item);
    this.formData = { ...item };
    this.showDrawer.set(true);
  }

  async saveItem(): Promise<void> {
    const edit = this.editingItem();
    if (edit && (edit.id || edit._id)) {
      const id = edit.id || edit._id!;
      const ok = await this.menuService.updateItem(id, this.formData);
      if (ok.success) {
        this.showDrawer.set(false);
      }
    } else {
      const ok = await this.menuService.createItem(this.formData);
      if (ok.success) {
        this.showDrawer.set(false);
      }
    }
  }

  async deleteItem(item: MenuItem): Promise<void> {
    const id = item.id || item._id;
    if (id && confirm(`Are you sure you want to remove "${item.name}" from the menu?`)) {
      await this.menuService.deleteItem(id);
    }
  }

  async saveCategory(): Promise<void> {
    if (!this.newCategoryName.trim()) return;
    await this.menuService.createCategory(this.newCategoryName.trim());
    this.newCategoryName = '';
    this.showNewCategoryModal.set(false);
  }
}
