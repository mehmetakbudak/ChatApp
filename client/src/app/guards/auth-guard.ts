import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  const token = authService.getToken();

  if (token) {
    try {
      // JWT token'ın payload kısmını decode ediyoruz
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const decodedPayload = JSON.parse(atob(payloadBase64));
        const exp = decodedPayload.exp;
        const currentUnixTime = Math.floor(Date.now() / 1000);

        if (exp && currentUnixTime >= exp) {
          // Token süresi dolmuş
          authService.logout();
          router.navigate(['/login']);
          return false;
        }
      }
      return true;
    } catch (e) {
      // Hatalı veya bozunmuş token durumu
      authService.logout();
      router.navigate(['/login']);
      return false;
    }
  } else {
    // Token yoksa kullanıcıyı giriş sayfasına postala ve geçişi engelle
    router.navigate(['/login']);
    return false;
  }
};
