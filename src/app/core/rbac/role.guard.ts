import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Role } from '../../shared/models/auth.model';

export function roleGuard(allowedRoles: Role[]): CanActivateFn {
  return (route: ActivatedRouteSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const userRole = authService.userRole();

    if (userRole === 'super_admin' || allowedRoles.includes(userRole)) {
      return true;
    }

    // Role does not have access: redirect to role's primary landing view
    if (userRole === 'kitchen') {
      return router.createUrlTree(['/kitchen/kds-board']);
    } else if (userRole === 'cashier') {
      return router.createUrlTree(['/orders']);
    } else {
      return router.createUrlTree(['/dashboard']);
    }
  };
}
