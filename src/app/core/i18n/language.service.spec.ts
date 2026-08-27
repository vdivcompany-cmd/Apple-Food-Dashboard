import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LanguageService]
    });
    service = TestBed.inject(LanguageService);
  });

  it('should be created with default language', () => {
    expect(service).toBeTruthy();
    expect(['en', 'ar']).toContain(service.currentLanguage());
  });

  it('should toggle language from en to ar', () => {
    service.setLanguage('en');
    expect(service.currentLanguage()).toBe('en');
    expect(service.direction()).toBe('ltr');

    service.toggleLanguage();
    expect(service.currentLanguage()).toBe('ar');
    expect(service.direction()).toBe('rtl');
  });
});
