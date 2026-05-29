import { Component, inject } from '@angular/core';
import { Auth } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card'; // PrimeNG Card
import { InputTextModule } from 'primeng/inputtext'; // PrimeNG Input
import { ButtonModule } from 'primeng/button'; // PrimeNG Button
import { MessageModule } from 'primeng/message'; // PrimeNG Hata Mesajı Kutusu
@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
   CardModule,       // Eklendi
    InputTextModule,  // Eklendi
    ButtonModule,     // Eklendi
    MessageModule     // Eklendi
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private authService = inject(Auth);
  private router = inject(Router);

  loginData = { email: '', password: '' };
  errorMessage: string = '';

  onLogin(): void {
    this.errorMessage = '';

    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Lütfen tüm alanları doldurunuz.';
      return;
    }

    this.authService.login(this.loginData).subscribe({
      next: () => {
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.';
      }
    });
  }
}
