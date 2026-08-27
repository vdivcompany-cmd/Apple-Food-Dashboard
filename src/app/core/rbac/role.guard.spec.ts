import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../auth/auth.service';
import { signal } from '@angular/core';

describe('roleGuard', () => {
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(() => {
    mockAuthService = {
      userRole: signal('cashier')
    };
    mockRouter = {
      createUrlTree: (commands: any[]) => commands.join('/')
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('should allow super_admin access regardless of allowedRoles', () => {
    mockAuthService.userRole = signal('super_admin');
    const guard = roleGuard(['owner']);
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    expect(result).toBe(true);
  });

  it('should allow user if their role is in allowedRoles', () => {
    mockAuthService.userRole = signal('manager');
    const guard = roleGuard(['owner', 'manager']);
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    expect(result).toBe(true);
  });

  it('should redirect cashier to /orders if trying to access owner route', () => {
    mockAuthService.userRole = signal('cashier');
    const guard = roleGuard(['owner']);
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    expect(result).toBe('/orders');
  });

  it('should redirect kitchen to /kitchen/kds-board if trying to access owner route', () => {
    mockAuthService.userRole = signal('kitchen');
    const guard = roleGuard(['owner']);
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    expect(result).toBe('/kitchen/kds-board');
  });
});
