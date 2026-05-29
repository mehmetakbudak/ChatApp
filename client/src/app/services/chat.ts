import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Auth } from './auth';

@Injectable({
  providedIn: 'root',
})
export class Chat {
  private http = inject(HttpClient);
  private authService = inject(Auth);
  private apiUrl = `${environment.apiUrl}/api/chat`;

  // İsteklere JWT Token eklemek için yardımcı metot
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getChats(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/GetMyChats`, { headers: this.getHeaders() });
  }

  getChatById(chatId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/GetChatById/${chatId}`, {
      headers: this.getHeaders(),
    });
  }

  createChat(receiverId: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/CreateChat/${receiverId}`,
      {},
      { headers: this.getHeaders() },
    );
  }
}
