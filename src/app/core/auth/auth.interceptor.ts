import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.accessToken();
  const tenantId = authService.tenantId();
  const branchId = authService.branchId();

  let headers = req.headers;
  let params = req.params;

  // 1. Attach JWT Bearer token if available
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  // 2. Do not attach tenant/branch headers on public auth endpoints
  const isAuthEndpoint =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/forgot-password') ||
    req.url.includes('/auth/refresh');

  if (!isAuthEndpoint) {
    // Only attach X-Tenant-Id if it is a valid MongoDB 24-hex ObjectId
    if (tenantId && OBJECT_ID_REGEX.test(tenantId)) {
      headers = headers.set('X-Tenant-Id', tenantId);
      if (!params.has('tenantId')) {
        params = params.set('tenantId', tenantId);
      }
    }

    // Only attach X-Branch-Id header if it is a valid MongoDB 24-hex ObjectId
    if (branchId && OBJECT_ID_REGEX.test(branchId)) {
      headers = headers.set('X-Branch-Id', branchId);
    }
  }

  const clonedReq = req.clone({ headers, params });

  return next(clonedReq).pipe(
    catchError((error: any) => {
      // 3. Handle 401 Unauthorized by attempting token refresh
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthEndpoint) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken().pipe(
            switchMap((refreshRes) => {
              isRefreshing = false;
              const newToken = refreshRes.data?.tokens?.accessToken || '';
              refreshTokenSubject.next(newToken);
              const retryHeaders = headers.set('Authorization', `Bearer ${newToken}`);
              const retryReq = req.clone({ headers: retryHeaders, params });
              return next(retryReq);
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              refreshTokenSubject.next(null);
              authService.logout();
              return throwError(() => refreshErr);
            })
          );
        } else {
          // Wait until token refresh completes and retry
          return refreshTokenSubject.pipe(
            filter((t) => t !== null),
            take(1),
            switchMap((newToken) => {
              const retryHeaders = headers.set('Authorization', `Bearer ${newToken}`);
              const retryReq = req.clone({ headers: retryHeaders, params });
              return next(retryReq);
            })
          );
        }
      }

      return throwError(() => error);
    })
  );
};


