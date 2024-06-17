import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://174.177.123.253:3107/api/v1/users';

  constructor(private http: HttpClient) { }

  connectWithToken(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/connect`, { token });
  }

  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/user_list`);
  }
}
