import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ThemeService]
    });
    service = TestBed.inject(ThemeService);
  });

  it('should be created with a valid theme', () => {
    expect(service).toBeTruthy();
    expect(['dark', 'light']).toContain(service.theme());
  });

  it('should toggle theme between dark and light', () => {
    service.theme.set('dark');
    expect(service.theme()).toBe('dark');

    service.toggleTheme();
    expect(service.theme()).toBe('light');

    service.toggleTheme();
    expect(service.theme()).toBe('dark');
  });
});
