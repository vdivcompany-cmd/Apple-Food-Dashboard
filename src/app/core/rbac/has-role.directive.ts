import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Role } from '../../shared/models/auth.model';

@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  private allowedRoles: Role[] = [];
  private hasView = false;

  @Input() set appHasRole(roles: Role | Role[]) {
    this.allowedRoles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  constructor() {
    effect(() => {
      // Re-evaluate whenever user role signal changes
      this.authService.userRole();
      this.updateView();
    });
  }

  private updateView(): void {
    const currentRole = this.authService.userRole();
    const isSuperAdmin = currentRole === 'super_admin';
    const isAllowed = isSuperAdmin || this.allowedRoles.includes(currentRole);

    if (isAllowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isAllowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
