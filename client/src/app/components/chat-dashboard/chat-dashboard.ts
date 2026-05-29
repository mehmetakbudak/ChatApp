import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ViewChild,
  ElementRef,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { SplitterModule } from 'primeng/splitter'; // p-splitter için
import { ScrollPanelModule } from 'primeng/scrollpanel'; // p-scrollPanel için
import { ButtonModule } from 'primeng/button'; // pButton için
import { InputTextModule } from 'primeng/inputtext'; // pInputText için
import { DialogService } from 'primeng/dynamicdialog';
import { Subscription } from 'rxjs';
import { Signalr } from '../../services/signalr';
import { Auth } from '../../services/auth';
import { Chat } from '../../services/chat';
import { DialogModule } from 'primeng/dialog';
import { User } from '../../services/user';
import { BadgeModule } from 'primeng/badge';

@Component({
  selector: 'app-chat-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SplitterModule,
    ScrollPanelModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    ConfirmDialogModule,
    BadgeModule
  ],
  providers: [DialogService, ConfirmationService],
  templateUrl: './chat-dashboard.html',
  styleUrls: ['./chat-dashboard.scss'],
})
export class ChatDashboardComponent implements OnInit, OnDestroy {
  private chatService = inject(Chat);
  private authService = inject(Auth);
  private signalrService = inject(Signalr);
  private userService = inject(User);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  myFullName: string = '';
  myChats = signal<any[]>([]);
  selectedChatId: string | null = null;
  messages = signal<any[]>([]);
  newMessage: string = '';
  currentUserId: string = '';
  isDialogVisible: boolean = false;
  users: any[] = [];
  msgSub?: Subscription;
  selectedUser: any;

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId() || '';
    this.myFullName = this.authService.getFullName();
    this.loadMyChats();

    this.signalrService.startConnection();
    this.msgSub = this.signalrService.messageReceived$.subscribe((msg) => {
      if (msg) {
        const msgChatId = msg.chatId || msg.chatRoomId;
        if (msgChatId === this.selectedChatId) {
          this.loadMyChats();
          this.messages.set([...this.messages(), msg]);
          this.scrollToBottom();
        } else {
          this.myChats.update((chats) => {
            const index = chats.findIndex((c: any) => c.id === msgChatId);
            if (index !== -1) {
              const updatedChat = { ...chats[index], unReadCount: (chats[index].unReadCount || 0) + 1 };
              return [...chats.slice(0, index), updatedChat, ...chats.slice(index + 1)];
            }
            return chats;
          });
        }
      }
    });
  }

  scrollToBottom(): void {
    if (this.messageContainer) {
      setTimeout(() => {
        const element = this.messageContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }, 50);
    }
  }

  ngOnDestroy(): void {
    if (this.msgSub) {
      this.msgSub.unsubscribe();
    }
    this.signalrService.stopConnection();
  }

  loadMyChats(): void {
    this.chatService.getChats().subscribe((chats: any) => {
      this.myChats.set(chats.map((chat: any) => ({ unReadCount: 0, ...chat })));
    });
  }

  openNewChatModal(): void {
    this.isDialogVisible = true;
    this.userService.getAllUsers().subscribe({
      next: (data) => (this.users = data),
      error: (err) => console.error('Kullanıcılar yüklenirken hata:', err),
    });
  }

  selectChat(chatId: string): void {
    this.selectedChatId = chatId;
    this.chatService.getChatById(chatId).subscribe((res: any) => {
      this.messages.set(res.messages || []);
      this.selectedUser = res.participants.find((user: any) => user.id !== this.currentUserId);
      this.scrollToBottom();
    });
    this.myChats.update((chats) => {
      const index = chats.findIndex((c: any) => c.id === chatId);
      if (index !== -1) {
        const updatedChat = { ...chats[index], unReadCount: 0 };
        return [...chats.slice(0, index), updatedChat, ...chats.slice(index + 1)];
      }
      return chats;
    });
  }

  get selectedChat(): any {
    return this.myChats().find((chat: any) => chat.id === this.selectedChatId);
  }

  getChatName(chat: any): string {
    return chat?.user?.fullName || chat?.name || '';
  }

  getChatInitials(chat: any): string {
    const name = this.getChatName(chat);
    return this.getInitialName(name);
  }

  getInitialName(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  sendMsg(): void {
    if (!this.newMessage.trim() || !this.selectedChatId) return;

    const receiverId = this.selectedChat?.user?.id;
    if (!receiverId) {
      console.error('Mesaj gönderilecek alıcı bulunamadı.');
      return;
    }

    this.signalrService
      .sendMessage(receiverId, this.selectedChatId, this.newMessage)
      .then(() => {
        this.scrollToBottom();
        this.newMessage = '';
        this.cdr.markForCheck();
        this.loadMyChats();
      })
      .catch((err) => {
        console.error('Mesaj gönderilirken hata oluştu: ', err);
      });
  }

  logout(): void {
    this.confirmationService.confirm({
      message: 'Çıkış yapmak istediğinize emin misiniz?',
      header: 'Oturumu Kapat',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet',
      rejectLabel: 'Hayır',
      acceptButtonStyleClass: 'p-button-primary p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => {
        this.authService.logout();
        this.router.navigate(['/login']);
      },
    });
  }

  selectUserAndStartChat(userId: string): void {
    this.chatService.createChat(userId).subscribe({
      next: (chatRoom) => {
        this.isDialogVisible = false;
        this.loadMyChats();
        if (chatRoom && chatRoom.id) {
          this.selectChat(chatRoom.id);
        }
        console.log('Yeni sohbet odası başarıyla oluşturuldu:', chatRoom);
      },
      error: (err) => {
        console.error('Sohbet başlatılırken hata oluştu:', err);
      },
    });
  }
}
