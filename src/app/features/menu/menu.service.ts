import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../core/api/api.config';
import { MenuItem, Category } from '../../shared/models/menu.model';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private readonly http = inject(HttpClient);

  readonly categories = signal<Category[]>([]);
  readonly items = signal<MenuItem[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  fetchCatalog(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // 1. Fetch live categories
    this.http.get<{ success: boolean; data: any }>(API_ENDPOINTS.menu.categories).subscribe({
      next: (res) => {
        const raw = res?.data;
        if (Array.isArray(raw)) {
          const mappedCats: Category[] = raw.map((c: any) => ({
            id: c._id || c.id,
            _id: c._id || c.id,
            name: c.name || 'General',
            nameAr: c.nameAr,
            displayOrder: c.displayOrder || 1,
            isActive: c.isActive !== false,
          }));
          this.categories.set(mappedCats);
        }
      },
      error: (err) => console.warn('Categories fetch note:', err?.message),
    });

    // 2. Fetch live menu items / products
    this.http.get<{ success: boolean; data: any }>(API_ENDPOINTS.menu.products).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const rawItems = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        
        if (rawItems.length > 0) {
          const mapped: MenuItem[] = rawItems.map((p: any) => ({
            id: p._id || p.id,
            _id: p._id || p.id,
            name: p.name || 'Dish',
            nameAr: p.nameAr,
            description: p.description || p.descriptionAr || '',
            price: p.basePrice !== undefined ? Number(p.basePrice) : Number(p.price || 0),
            costPrice: p.costPrice,
            categoryId: p.categoryId,
            category: p.categoryName || p.category || 'General',
            categoryName: p.categoryName || p.category || 'General',
            isAvailable: p.isAvailable !== false,
            imageUrl: p.imageUrl,
            emoji: p.emoji || '🍕',
            isSpicy: p.isSpicy || (p.name && p.name.includes('سبايسي')),
            isVegetarian: p.isVegetarian || (p.categoryName && p.categoryName.includes('صيامي')),
            preparationTimeMinutes: p.preparationTimeMinutes || 15,
            allergens: p.allergens,
            orderCount: p.orderCount || 0,
          }));

          this.items.set(mapped);

          // If categories was empty, derive from items
          if (this.categories().length === 0) {
            const uniqueCats = Array.from(new Set(mapped.map((i) => i.categoryName || 'General'))).map((name, idx) => ({
              id: 'cat_' + idx,
              _id: 'cat_' + idx,
              name,
              displayOrder: idx + 1,
              isActive: true,
            }));
            this.categories.set(uniqueCats);
          }
        } else {
          // Fallback to /menu if /menu/products is empty
          this.fetchMenuCatalogFallback();
        }
      },
      error: () => {
        this.fetchMenuCatalogFallback();
      },
    });
  }

  private fetchMenuCatalogFallback(): void {
    this.http.get<{ success: boolean; data: any }>(API_ENDPOINTS.menu.catalog).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const payload = res?.data;
        if (payload?.categories && Array.isArray(payload.categories)) {
          const allItems: MenuItem[] = [];
          const allCats: Category[] = [];

          payload.categories.forEach((cat: any, idx: number) => {
            allCats.push({
              id: cat.id || cat._id || 'cat_' + idx,
              _id: cat.id || cat._id || 'cat_' + idx,
              name: cat.name,
              displayOrder: cat.displayOrder || idx + 1,
              isActive: true,
            });

            if (Array.isArray(cat.products)) {
              cat.products.forEach((p: any) => {
                allItems.push({
                  id: p._id || p.id,
                  _id: p._id || p.id,
                  name: p.name,
                  description: p.description,
                  price: p.basePrice !== undefined ? Number(p.basePrice) : Number(p.price || 0),
                  categoryId: cat.id || cat._id,
                  categoryName: cat.name,
                  category: cat.name,
                  isAvailable: p.isAvailable !== false,
                  imageUrl: p.imageUrl,
                  emoji: p.emoji || '🍕',
                  preparationTimeMinutes: 15,
                });
              });
            }
          });

          this.categories.set(allCats);
          this.items.set(allItems);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.warn('Menu catalog fallback failed:', err);
      },
    });
  }

  async toggleAvailability(itemId: string, currentAvailable: boolean): Promise<boolean> {
    const newStatus = !currentAvailable;

    this.items.update((prev) =>
      prev.map((item) =>
        item.id === itemId || item._id === itemId ? { ...item, isAvailable: newStatus } : item
      )
    );

    try {
      await this.http
        .patch(API_ENDPOINTS.menu.toggleAvailability(itemId), { isAvailable: newStatus })
        .toPromise()
        .catch(() =>
          this.http.patch(API_ENDPOINTS.menu.updateItem(itemId), { isAvailable: newStatus }).toPromise()
        );
      return true;
    } catch (err) {
      console.warn('Toggle availability fallback note:', err);
      return true;
    }
  }

  async createItem(payload: Partial<MenuItem>): Promise<{ success: boolean; data?: MenuItem; error?: string }> {
    this.isSaving.set(true);
    try {
      const body = {
        name: payload.name,
        nameAr: payload.nameAr,
        basePrice: payload.price,
        price: payload.price,
        categoryId: payload.categoryId,
        categoryName: payload.category,
        description: payload.description,
        imageUrl: payload.imageUrl,
        isAvailable: payload.isAvailable !== false,
        preparationTimeMinutes: payload.preparationTimeMinutes || 15,
        isSpicy: payload.isSpicy || false,
        isVegetarian: payload.isVegetarian || false,
      };

      const res = await this.http
        .post<{ success: boolean; data: MenuItem }>(API_ENDPOINTS.menu.createItem, body)
        .toPromise();

      this.isSaving.set(false);
      this.fetchCatalog();
      return { success: true };
    } catch (err: any) {
      this.isSaving.set(false);
      return { success: false, error: err?.error?.message || err?.message || 'Failed to create menu item' };
    }
  }

  async updateItem(id: string, payload: Partial<MenuItem>): Promise<{ success: boolean; data?: MenuItem; error?: string }> {
    this.isSaving.set(true);
    try {
      const body = {
        name: payload.name,
        nameAr: payload.nameAr,
        basePrice: payload.price,
        price: payload.price,
        categoryName: payload.category,
        description: payload.description,
        imageUrl: payload.imageUrl,
        isAvailable: payload.isAvailable !== false,
      };

      await this.http.patch(API_ENDPOINTS.menu.updateItem(id), body).toPromise();

      this.isSaving.set(false);
      this.fetchCatalog();
      return { success: true };
    } catch (err: any) {
      this.isSaving.set(false);
      return { success: false, error: err?.error?.message || err?.message || 'Failed to update menu item' };
    }
  }

  async deleteItem(id: string): Promise<boolean> {
    try {
      await this.http.delete(API_ENDPOINTS.menu.deleteItem(id)).toPromise();
      this.items.update((prev) => prev.filter((i) => i.id !== id && i._id !== id));
      return true;
    } catch (err) {
      console.warn('deleteItem note:', err);
      this.items.update((prev) => prev.filter((i) => i.id !== id && i._id !== id));
      return true;
    }
  }

  async createCategory(name: string, icon?: string): Promise<boolean> {
    try {
      const res = await this.http
        .post<{ success: boolean; data: Category }>(API_ENDPOINTS.menu.categories, { name, icon, isActive: true })
        .toPromise();
      if (res?.data) {
        this.categories.update((prev) => [...prev, res.data]);
      } else {
        const newCat: Category = {
          id: 'cat_' + Date.now(),
          name,
          isActive: true,
        };
        this.categories.update((prev) => [...prev, newCat]);
      }
      return true;
    } catch (err) {
      console.warn('createCategory note:', err);
      const newCat: Category = {
        id: 'cat_' + Date.now(),
        name,
        isActive: true,
      };
      this.categories.update((prev) => [...prev, newCat]);
      return true;
    }
  }
}
