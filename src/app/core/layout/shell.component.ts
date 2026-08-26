import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="flex min-h-screen bg-background text-text-primary font-sans antialiased transition-colors duration-200">
      <!-- Persistent Role-Gated Sidebar (240px / 72px) -->
      <app-sidebar></app-sidebar>

      <!-- Main Layout Body -->
      <div class="flex-1 flex flex-col min-w-0 bg-background">
        <app-topbar></app-topbar>

        <!-- High-Density Fluid Content Area (24px gutter) -->
        <main class="flex-1 p-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent {}
