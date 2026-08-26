import { AppIconComponent } from '../app-icon/app-icon.component';
﻿import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    <div class="relative flex items-center w-full">
      <div class="absolute left-3 flex items-center pointer-events-none text-text-muted">
        <app-icon name="search" class="w-4 h-4"></app-icon>
      </div>

      <input
        type="text"
        [value]="value"
        (input)="onInputChange($event)"
        [placeholder]="placeholder || 'Search...'"
        class="w-full pl-9 pr-8 py-2 text-xs rounded-lg bg-surface-container border border-border focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none transition text-text-primary placeholder:text-text-muted"
      />

      @if (value) {
        <button
          type="button"
          (click)="clear()"
          class="absolute right-2.5 text-text-muted hover:text-text-primary p-0.5"
        >
          <app-icon name="x" class="w-3.5 h-3.5"></app-icon>
        </button>
      }
    </div>
  `,
})
export class SearchInputComponent {
  @Input() placeholder: string = 'Search...';
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  onInputChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value = val;
    this.valueChange.emit(val);
  }

  clear(): void {
    this.value = '';
    this.valueChange.emit('');
  }
}

