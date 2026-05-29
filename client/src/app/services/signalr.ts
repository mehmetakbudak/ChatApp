import { inject, Injectable } from '@angular/core';
import { Auth } from './auth';
import * as signalr from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Signalr {
  private authService = inject(Auth);
  private hubConnection!: signalr.HubConnection;

  public messageReceived$ = new Subject<any>();

  startConnection(): void {
    const token = this.authService.getToken();
    if (!token) {
      console.error('SignalR bağlantısı için geçerli bir token bulunamadı.');
      return;
    }

    this.hubConnection = new signalr.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/chathub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR Hub bağlantısı başarıyla kuruldu!'))
      .catch(err => console.error('SignalR bağlantısı kurulurken hata oluştu: ', err));

    this.hubConnection.on('ReceiveMessage', (message) => {
      this.messageReceived$.next(message);
    });
  }

  sendMessage(receiverId: string, chatId: string, content: string): Promise<void> {
    if (this.hubConnection) {
      return this.hubConnection.invoke('SendMessage', receiverId, chatId, content);
    }
    return Promise.reject('Bağlantı henüz hazır değil veya sunucu ortamı.');
  }

  stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop().then(() => console.log('SignalR bağlantısı kapatıldı.'));
    }
  }
}
