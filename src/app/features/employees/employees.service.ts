import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../core/api/api.config';
import { Employee, CreateEmployeePayload } from '../../shared/models/employee.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeesService {
  private readonly http = inject(HttpClient);

  readonly employees = signal<Employee[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  fetchEmployees(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<{ success: boolean; data: Employee[] }>(API_ENDPOINTS.employees.list).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res?.success && Array.isArray(res.data)) {
          this.employees.set(res.data);
        } else {
          this.employees.set([]);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.warn('EmployeesService.fetchEmployees error:', err);
        this.error.set(err?.error?.message || 'Failed to load employees');
      },
    });
  }

  async createEmployee(payload: CreateEmployeePayload): Promise<boolean> {
    this.isSaving.set(true);
    try {
      const res = await this.http
        .post<{ success: boolean; data: Employee }>(API_ENDPOINTS.employees.create, payload)
        .toPromise();

      this.isSaving.set(false);
      if (res?.success) {
        this.fetchEmployees();
        return true;
      }
      return false;
    } catch (err: any) {
      this.isSaving.set(false);
      console.warn('EmployeesService.createEmployee error:', err);
      return false;
    }
  }

  async updateEmployee(id: string, payload: Partial<CreateEmployeePayload>): Promise<boolean> {
    this.isSaving.set(true);
    try {
      const res = await this.http
        .put<{ success: boolean; data: Employee }>(API_ENDPOINTS.employees.update(id), payload)
        .toPromise();

      this.isSaving.set(false);
      if (res?.success) {
        this.fetchEmployees();
        return true;
      }
      return false;
    } catch (err: any) {
      this.isSaving.set(false);
      console.warn('EmployeesService.updateEmployee error:', err);
      return false;
    }
  }

  async deleteEmployee(id: string): Promise<boolean> {
    this.isSaving.set(true);
    try {
      const res = await this.http
        .delete<{ success: boolean; message: string }>(API_ENDPOINTS.employees.delete(id))
        .toPromise();

      this.isSaving.set(false);
      if (res?.success) {
        this.fetchEmployees();
        return true;
      }
      return false;
    } catch (err: any) {
      this.isSaving.set(false);
      console.warn('EmployeesService.deleteEmployee error:', err);
      return false;
    }
  }
}
