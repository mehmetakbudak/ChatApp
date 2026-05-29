import { Routes } from '@angular/router';
import { ChatDashboardComponent } from './components/chat-dashboard/chat-dashboard';
import { authGuard } from './guards/auth-guard';
import { Login } from './components/login/login';
import { Register } from './components/register/register';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'chat', component: ChatDashboardComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/chat', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
