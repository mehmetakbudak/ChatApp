import { environment } from './../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/Auth`;

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/Register`, data);
  }

  login(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/Login`, data).pipe(
      tap((response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('userId', response.userId);
        localStorage.setItem('fullName', response.fullName);
      }),
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserId(): string {
    return localStorage.getItem('userId') || '';
  }

  getFullName(): string {
    const fullName = localStorage.getItem('fullName');
    return fullName ? fullName : '';
  }

  logout(): void {
    localStorage.clear();
  }
}
