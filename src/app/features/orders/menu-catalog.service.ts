import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../core/api/api.config';
import { MenuItem, Category } from '../../shared/models/menu.model';
import { RestaurantTable } from '../../shared/models/table.model';

@Injectable({
  providedIn: 'root',
})
export class MenuCatalogService {
  private readonly http = inject(HttpClient);

  readonly categories = signal<Category[]>([]);
  readonly products = signal<MenuItem[]>([]);
  readonly tables = signal<RestaurantTable[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly selectedCategory = signal<string>('All');
  readonly searchQuery = signal<string>('');

  readonly filteredProducts = computed(() => {
    const all = this.products();
    const cat = this.selectedCategory();
    const query = this.searchQuery().trim().toLowerCase();

    return all.filter((item) => {
      // Category match
      const categoryMatch =
        cat === 'All' ||
        item.categoryName?.toLowerCase() === cat.toLowerCase() ||
        item.category?.toLowerCase() === cat.toLowerCase() ||
        item.categoryId === cat;

      // Query match
      const queryMatch =
        !query ||
        item.name?.toLowerCase().includes(query) ||
        item.nameAr?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query);

      return categoryMatch && queryMatch;
    });
  });

  fetchCatalog(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<{ success: boolean; data: any }>(API_ENDPOINTS.menu.catalog).subscribe({
      next: (res) => {
        const payload = res?.data;
        if (Array.isArray(payload)) {
          // Flattened products or categories
          this.products.set(payload);
          // Derive categories if not separated
          const uniqueCats = Array.from(
            new Set(payload.map((p) => p.categoryName || p.category || 'General'))
          ).map((name, i) => ({
            id: 'cat_' + i,
            name,
            displayOrder: i,
            isActive: true,
          }));
          this.categories.set(uniqueCats);
        } else if (payload && typeof payload === 'object') {
          if (Array.isArray(payload.products)) {
            this.products.set(payload.products);
          } else if (Array.isArray(payload.items)) {
            this.products.set(payload.items);
          }

          if (Array.isArray(payload.categories)) {
            this.categories.set(payload.categories);
          } else {
            // Derive categories
            const items = this.products();
            const uniqueCats = Array.from(
              new Set(items.map((p) => p.categoryName || p.category || 'General'))
            ).map((name, i) => ({
              id: 'cat_' + i,
              name,
              displayOrder: i,
              isActive: true,
            }));
            this.categories.set(uniqueCats);
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.warn('MenuCatalogService.fetchCatalog error:', err);
        this.error.set(err?.error?.message || 'Failed to load menu catalog');
        this.isLoading.set(false);
      },
    });
  }

  fetchTables(): void {
    this.http.get<{ success: boolean; data: RestaurantTable[] }>(API_ENDPOINTS.tables.list).subscribe({
      next: (res) => {
        const tables = Array.isArray(res?.data) ? res.data : [];
        this.tables.set(tables);
      },
      error: (err) => {
        console.warn('MenuCatalogService.fetchTables error:', err);
      },
    });
  }
}
