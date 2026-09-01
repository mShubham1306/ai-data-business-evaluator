import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
  company_name?: string;
}

export interface AuthResponse {
  message: string;
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    company_name?: string;
  };
}

export type StoredUser = AuthResponse['user'];

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  private currentUserSubject = new BehaviorSubject<StoredUser | null>(this.getStoredUser());
  
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  currentUser$ = this.currentUserSubject.asObservable();
  
  constructor(private http: HttpClient) {}
  
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          this.setToken(response.access_token);
          this.setStoredUser(response.user);
          this.isAuthenticatedSubject.next(true);
          this.currentUserSubject.next(response.user);
        })
      );
  }
  
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data)
      .pipe(
        tap(response => {
          this.setToken(response.access_token);
          this.setStoredUser(response.user);
          this.isAuthenticatedSubject.next(true);
          this.currentUserSubject.next(response.user);
        })
      );
  }
  
  logout(): void {
    this.removeToken();
    this.removeStoredUser();
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }
  
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }
  
  setToken(token: string): void {
    localStorage.setItem('access_token', token);
  }
  
  removeToken(): void {
    localStorage.removeItem('access_token');
  }
  
  hasToken(): boolean {
    return !!this.getToken();
  }
  
  getStoredUser(): StoredUser | null {
    const raw = localStorage.getItem('nova_user');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
  
  private setStoredUser(user: StoredUser): void {
    localStorage.setItem('nova_user', JSON.stringify(user));
  }
  
  private removeStoredUser(): void {
    localStorage.removeItem('nova_user');
  }
  
  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
  }
}
