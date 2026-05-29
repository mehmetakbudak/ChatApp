import { Component, inject } from '@angular/core';
import { Auth } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card'; // PrimeNG Kart bileşeni
import { InputTextModule } from 'primeng/inputtext'; // PrimeNG Girdi bileşeni
import { ButtonModule } from 'primeng/button'; // PrimeNG Buton bileşeni
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    MessageModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private authService = inject(Auth);
  private router = inject(Router);

  registerData = { fullName: '', email: '', password: '' };
  errorMessage: string = '';

  onRegister(): void {
    this.errorMessage = '';

    // Temel form kontrolü
    if (!this.registerData.fullName || !this.registerData.email || !this.registerData.password) {
      this.errorMessage = 'Lütfen tüm alanları eksiksiz doldurunuz.';
      return;
    }

    // AuthService üzerinden backend .NET 10 API'sine kayıt isteği gönderiliyor
    this.authService.register(this.registerData).subscribe({
      next: () => {
        // Kayıt başarılı ise kullanıcıyı doğrudan giriş ekranına yönlendiriyoruz
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Kayıt esnasında bir hata oluştu.';
      }
    });
  }
}
