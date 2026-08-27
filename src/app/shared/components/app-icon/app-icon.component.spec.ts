import { TestBed } from '@angular/core/testing';
import { AppIconComponent } from './app-icon.component';

describe('AppIconComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppIconComponent]
    }).compileComponents();
  });

  it('should render icon with custom class', () => {
    const fixture = TestBed.createComponent(AppIconComponent);
    fixture.componentRef.setInput('name', 'utensils');
    fixture.componentRef.setInput('customClass', 'w-5 h-5 text-primary');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const svg = el.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.classList.contains('w-5')).toBe(true);
    expect(svg?.classList.contains('text-primary')).toBe(true);
  });
});
