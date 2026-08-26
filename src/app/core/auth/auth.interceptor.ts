import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.accessToken();
  const tenantId = authService.tenantId();
  const branchId = authService.branchId();

  let headers = req.headers;

  // 1. Attach JWT Bearer token if available
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  // 2. Do not attach tenant/branch headers on public auth endpoints
  const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/forgot-password') || req.url.includes('/auth/refresh');

  if (!isAuthEndpoint) {
    // Only attach X-Tenant-Id if it is a valid MongoDB 24-hex ObjectId
    if (tenantId && OBJECT_ID_REGEX.test(tenantId)) {
      headers = headers.set('X-Tenant-Id', tenantId);
    }

    // Only attach X-Branch-Id if it is a valid MongoDB 24-hex ObjectId
    if (branchId && OBJECT_ID_REGEX.test(branchId)) {
      headers = headers.set('X-Branch-Id', branchId);
    }
  }

  const clonedReq = req.clone({ headers });
  return next(clonedReq);
};
