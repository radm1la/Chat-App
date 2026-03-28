import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class SettingsComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();

  oldPassword = '';
  newPassword = '';
  passwordError = '';
  passwordSuccess = '';
  showConfirmDelete = false;
  sessions: any[] = [];
  bannedUsers: any[] = [];

  constructor(
    private authService: AuthService,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.loadSessions();
    this.loadBannedUsers();
  }

  loadBannedUsers() {
    this.http.get<any[]>(`${environment.apiUrl}/friends/bans`).subscribe((users) => {
      this.bannedUsers = users;
    });
  }

  unbanUser(user: any) {
    if (!confirm(`Are you sure you want to unblock ${user.username}?`)) return;
    this.http.delete(`${environment.apiUrl}/friends/ban/${user.id}`).subscribe(() => {
      this.loadBannedUsers();
    });
  }

  loadSessions() {
    this.http.get<any[]>(`${environment.apiUrl}/auth/sessions`).subscribe((sessions) => {
      this.sessions = sessions;
    });
  }

  deleteSession(session: any) {
    this.http.delete(`${environment.apiUrl}/auth/sessions/${session.id}`).subscribe(() => {
      this.loadSessions();

      // If deleting current session, logout
      const currentToken = localStorage.getItem('token');
      if (session.token === currentToken) {
        this.authService.logout();
      }
    });
  }

  formatUserAgent(ua: string) {
    if (!ua) return 'Unknown browser';
    if (ua.includes('OPR') || ua.includes('Opera')) return 'Opera';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    return 'Unknown browser';
  }

  changePassword() {
    this.passwordError = '';
    this.passwordSuccess = '';

    this.http
      .post(`${environment.apiUrl}/auth/change-password`, {
        oldPassword: this.oldPassword,
        newPassword: this.newPassword,
      })
      .subscribe({
        next: () => {
          this.passwordSuccess = 'Password changed successfully!';
          this.oldPassword = '';
          this.newPassword = '';
        },
        error: (err) => {
          this.passwordError = err.error?.message || 'Failed to change password';
        },
      });
  }

  confirmDelete() {
    this.showConfirmDelete = true;
  }

  deleteAccount() {
    this.http.delete(`${environment.apiUrl}/auth/account`).subscribe({
      next: () => {
        this.authService.logout();
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  close() {
    this.closed.emit();
  }
}
