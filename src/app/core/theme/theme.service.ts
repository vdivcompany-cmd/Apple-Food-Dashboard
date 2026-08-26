import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'restaurant_os_theme';
  readonly theme = signal<ThemeMode>('dark'); // Default to Pro-Service Dark Mode

  constructor() {
    const saved = localStorage.getItem(this.STORAGE_KEY) as ThemeMode | null;
    if (saved === 'dark' || saved === 'light') {
      this.theme.set(saved);
    } else {
      // Default to dark mode for the Pro-Service Workspace
      this.theme.set('dark');
    }

    // Apply class immediately
    this.applyTheme(this.theme());

    effect(() => {
      const current = this.theme();
      localStorage.setItem(this.STORAGE_KEY, current);
      this.applyTheme(current);
    });
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }

  private applyTheme(mode: ThemeMode): void {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
