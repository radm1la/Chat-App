import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  currentUser$ = new BehaviorSubject<any>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    const user = localStorage.getItem('user');
    if (user) this.currentUser$.next(JSON.parse(user));
  }

  register(username: string, email: string, password: string) {
    return this.http.post(`${this.apiUrl}/auth/register`, { username, email, password });
  }

  login(email: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap((res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.currentUser$.next(res.user);
        this.router.navigate(['/chat']);
      }),
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getCurrentUser() {
    return this.currentUser$.value;
  }

  isLoggedIn() {
    return !!localStorage.getItem('token');
  }
}
