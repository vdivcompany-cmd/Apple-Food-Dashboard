import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError } from 'rxjs';
import { User, Role } from '../../shared/models/auth.model';
import { environment } from '../../../environments/environment';

export interface BackendAuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: {
      id?: string;
      _id?: string;
      name?: string;
      email: string;
      role: Role;
      tenantId: string;
      branchId?: string;
      phone?: string;
      avatarUrl?: string;
      isActive?: boolean;
    };
    tokens: {
      accessToken: string;
      refreshToken?: string;
      expiresIn?: number;
    };
    restaurantName?: string;
    branchName?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly TOKEN_KEY = 'restaurant_os_jwt';
  private readonly REFRESH_TOKEN_KEY = 'restaurant_os_refresh_jwt';
  private readonly USER_KEY = 'restaurant_os_user';
  private readonly TENANT_KEY = 'restaurant_os_tenant_id';

  readonly currentUser = signal<User | null>(this.getStoredUser());
  readonly accessToken = signal<string | null>(this.getStoredToken());
  readonly isLoading = signal<boolean>(false);
  readonly currentBranch = signal<string>('Main Branch — Downtown Cairo');
  readonly restaurantName = signal<string>('Apple Food Restaurant');

  readonly isAuthenticated = computed(() => !!this.currentUser() && !!this.accessToken());
  readonly userRole = computed<Role>(() => this.currentUser()?.role || 'cashier');
  readonly tenantId = computed<string>(() => this.currentUser()?.tenantId || localStorage.getItem(this.TENANT_KEY) || '');
  readonly branchId = computed<string>(() => this.currentUser()?.branchId || '');

  /**
   * Production Login for Restaurant Staff (Owner, Manager, Cashier, Kitchen)
   * Sends { tenantSlug: "apple-food", email, password }
   */
  login(email: string, password: string, tenantSlug?: string): Observable<BackendAuthResponse> {
    this.isLoading.set(true);

    const payload = {
      tenantSlug: (tenantSlug || environment.defaultTenantSlug || 'apple-food').trim(),
      email: email.trim(),
      password,
    };

    return this.http.post<BackendAuthResponse>(`${environment.apiUrl}/auth/login`, payload).pipe(
      tap((res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          const rawUser = res.data.user;
          const token = res.data.tokens?.accessToken || '';
          const refreshToken = res.data.tokens?.refreshToken || '';
          const tenantId = rawUser.tenantId || '';

          const user: User = {
            id: rawUser.id || rawUser._id || 'usr_default',
            name: rawUser.name || this.formatNameFromEmail(rawUser.email),
            email: rawUser.email,
            role: rawUser.role,
            tenantId: tenantId,
            branchId: rawUser.branchId || '',
            avatarUrl: rawUser.avatarUrl,
            phone: rawUser.phone,
            isActive: rawUser.isActive !== false,
            createdAt: new Date().toISOString(),
          };

          this.setSession(token, refreshToken, user, tenantId, res.data.restaurantName, res.data.branchName);
          this.navigateAfterLogin(user.role);
        }
      }),
      catchError((err) => {
        this.isLoading.set(false);
        throw err;
      })
    );
  }

  logout(): void {
    this.currentUser.set(null);
    this.accessToken.set(null);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TENANT_KEY);
    this.router.navigate(['/login']);
  }

  navigateAfterLogin(role: Role): void {
    switch (role) {
      case 'owner':
      case 'manager':
        this.router.navigate(['/dashboard']);
        break;
      case 'cashier':
        this.router.navigate(['/orders']);
        break;
      case 'kitchen':
        this.router.navigate(['/kitchen/kds-board']);
        break;
      default:
        this.router.navigate(['/dashboard']);
    }
  }

  private setSession(
    token: string,
    refreshToken: string,
    user: User,
    tenantId: string,
    restaurantName?: string,
    branchName?: string
  ): void {
    this.accessToken.set(token);
    this.currentUser.set(user);
    if (restaurantName) this.restaurantName.set(restaurantName);
    if (branchName) this.currentBranch.set(branchName);

    localStorage.setItem(this.TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    if (tenantId) {
      localStorage.setItem(this.TENANT_KEY, tenantId);
    }
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  private formatNameFromEmail(email: string): string {
    const localPart = email.split('@')[0] || 'Staff User';
    return localPart
      .split(/[._-]/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }
}
