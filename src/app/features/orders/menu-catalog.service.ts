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
        cat === 'all' ||
        (item.categoryName && item.categoryName.toLowerCase() === cat.toLowerCase()) ||
        (item.category && item.category.toLowerCase() === cat.toLowerCase()) ||
        item.categoryId === cat;

      // Query match
      const queryMatch =
        !query ||
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.nameAr && item.nameAr.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query));

      return categoryMatch && queryMatch;
    });
  });

  fetchCatalog(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // 1. Fetch categories
    this.http.get<{ success: boolean; data: any }>(API_ENDPOINTS.menu.categories).subscribe({
      next: (res) => {
        if (Array.isArray(res?.data)) {
          this.categories.set(res.data.map((c: any) => ({
            id: c._id || c.id,
            _id: c._id || c.id,
            name: c.name,
            nameAr: c.nameAr,
            isActive: c.isActive !== false,
          })));
        }
      },
      error: () => {},
    });

    // 2. Fetch products from /menu/products
    this.http.get<{ success: boolean; data: any }>(API_ENDPOINTS.menu.products).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const raw = Array.isArray(res?.data) ? res.data : [];
        if (raw.length > 0) {
          const mapped: MenuItem[] = raw.map((p: any) => ({
            id: p._id || p.id,
            _id: p._id || p.id,
            name: p.name,
            nameAr: p.nameAr,
            description: p.description,
            price: p.basePrice !== undefined ? Number(p.basePrice) : Number(p.price || 0),
            categoryId: p.categoryId,
            categoryName: p.categoryName || 'General',
            category: p.categoryName || 'General',
            isAvailable: p.isAvailable !== false,
            imageUrl: p.imageUrl,
            emoji: p.emoji || '🍕',
            preparationTimeMinutes: 15,
          }));

          this.products.set(mapped);

          if (this.categories().length === 0) {
            const uniqueCats = Array.from(new Set(mapped.map((p) => p.categoryName || 'General'))).map((name, i) => ({
              id: 'cat_' + i,
              name,
              isActive: true,
            }));
            this.categories.set(uniqueCats);
          }
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.warn('POS Catalog fetch error:', err);
      },
    });

    this.fetchTables();
  }

  fetchTables(): void {
    this.http.get<{ success: boolean; data: any }>(API_ENDPOINTS.tables.list).subscribe({
      next: (res) => {
        const raw = Array.isArray(res?.data) ? res.data : [];
        const tables: RestaurantTable[] = raw.map((t: any, idx: number) => ({
          id: t._id || t.id,
          _id: t._id || t.id,
          tableNumber: t.number !== undefined ? String(t.number) : String(idx + 1),
          name: t.name || `Table ${t.number !== undefined ? t.number : idx + 1}`,
          capacity: t.capacity || 4,
          status: (t.status || 'AVAILABLE').toLowerCase(),
          isAvailable: t.status === 'AVAILABLE' || t.status === 'available',
        }));
        this.tables.set(tables);
      },
      error: (err) => {
        console.warn('MenuCatalogService.fetchTables error:', err);
      },
    });
  }
}
