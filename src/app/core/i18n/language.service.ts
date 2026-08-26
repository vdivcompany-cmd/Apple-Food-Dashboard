import { Injectable, signal, effect } from '@angular/core';

export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly STORAGE_KEY = 'restaurant_os_lang';
  readonly currentLanguage = signal<Language>('en');
  readonly direction = signal<Direction>('ltr');

  constructor() {
    const saved = localStorage.getItem(this.STORAGE_KEY) as Language | null;
    if (saved === 'en' || saved === 'ar') {
      this.setLanguage(saved);
    }

    effect(() => {
      const lang = this.currentLanguage();
      const dir = lang === 'ar' ? 'rtl' : 'ltr';
      this.direction.set(dir);
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', dir);
      localStorage.setItem(this.STORAGE_KEY, lang);
    });
  }

  setLanguage(lang: Language): void {
    this.currentLanguage.set(lang);
  }

  toggleLanguage(): void {
    this.setLanguage(this.currentLanguage() === 'en' ? 'ar' : 'en');
  }

  isRtl(): boolean {
    return this.direction() === 'rtl';
  }
}
