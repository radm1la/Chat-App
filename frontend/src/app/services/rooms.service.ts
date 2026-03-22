import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RoomsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getPublicRooms(search?: string) {
    const params = search ? `?search=${search}` : '';
    return this.http.get<any[]>(`${this.apiUrl}/rooms/public${params}`);
  }

  getMyRooms() {
    return this.http.get<any[]>(`${this.apiUrl}/rooms/my`);
  }

  createRoom(name: string, description: string, isPrivate: boolean) {
    return this.http.post(`${this.apiUrl}/rooms`, { name, description, is_private: isPrivate });
  }

  joinRoom(roomId: string) {
    return this.http.post(`${this.apiUrl}/rooms/${roomId}/join`, {});
  }

  leaveRoom(roomId: string) {
    return this.http.post(`${this.apiUrl}/rooms/${roomId}/leave`, {});
  }

  getRoomMembers(roomId: string) {
    return this.http.get<any[]>(`${this.apiUrl}/rooms/${roomId}/members`);
  }

  inviteUser(roomId: string, username: string) {
    return this.http.post(`${this.apiUrl}/rooms/${roomId}/invite`, { username });
  }
}