import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class SettingsComponent {
  @Output() closed = new EventEmitter<void>();

  oldPassword = '';
  newPassword = '';
  passwordError = '';
  passwordSuccess = '';
  showConfirmDelete = false;

  constructor(private authService: AuthService, private http: HttpClient) {}

  changePassword() {
    this.passwordError = '';
    this.passwordSuccess = '';

    this.http.post(`${environment.apiUrl}/auth/change-password`, {
      oldPassword: this.oldPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.passwordSuccess = 'Password changed successfully!';
        this.oldPassword = '';
        this.newPassword = '';
      },
      error: (err) => {
        this.passwordError = err.error?.message || 'Failed to change password';
      }
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
      }
    });
  }

  close() {
    this.closed.emit();
  }
}