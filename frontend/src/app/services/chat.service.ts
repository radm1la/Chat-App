import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Socket, io } from 'socket.io-client';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private socket!: Socket;
  private apiUrl = environment.apiUrl;

  messages$ = new BehaviorSubject<any[]>([]);
  newMessage$ = new Subject<any>();
  presenceUpdates$ = new Subject<any>();
  memberCountUpdates$ = new Subject<any>();
  userBanned$ = new Subject<any>();
  userUnbanned$ = new Subject<any>();
  messageDeleted$ = new Subject<any>();
  messageEdited$ = new Subject<any>();
  personalMessageDeleted$ = new Subject<any>();
  personalMessageEdited$ = new Subject<any>();
  adminChanged$ = new Subject<any>();
  friendRequest$ = new Subject<any>();
  friendAccepted$ = new Subject<any>();
  friendRemoved$ = new Subject<any>();
  roomDeleted$ = new Subject<any>();
  roomCreated$ = new Subject<any>();
  memberJoined$ = new Subject<any>();
  memberLeft$ = new Subject<any>();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  connect() {
    const token = this.authService.getToken();
    this.socket = io(environment.wsUrl, {
      auth: { token },
    });

    this.socket.on('message:new', (message) => {
      this.newMessage$.next(message);
    });

    this.socket.on('personal:message', (message) => {
      this.newMessage$.next(message);
    });

    this.socket.on('presence:update', (data) => {
      this.presenceUpdates$.next(data);
    });

    this.socket.on('room:members-changed', (data) => {
      this.memberCountUpdates$.next(data);
    });

    this.socket.on('user:banned', (data) => {
      this.userBanned$.next(data);
    });

    this.socket.on('user:unbanned', (data) => {
      this.userUnbanned$.next(data);
    });

    this.socket.on('message:deleted', (data) => {
      this.messageDeleted$.next(data);
    });

    this.socket.on('message:edited', (data) => {
      this.messageEdited$.next(data);
    });

    this.socket.on('personal:message:deleted', (data) => {
      this.personalMessageDeleted$.next(data);
    });

    this.socket.on('personal:message:edited', (data) => {
      this.personalMessageEdited$.next(data);
    });

    this.socket.on('room:admin-changed', (data) => {
      this.adminChanged$.next(data);
    });

    this.socket.on('friend:request', (data) => {
      this.friendRequest$.next(data);
    });

    this.socket.on('friend:accepted', () => {
      this.friendAccepted$.next(null);
    });

    this.socket.on('friend:removed', () => {
      this.friendRemoved$.next(null);
    });

    this.socket.on('room:deleted', (data) => {
      this.roomDeleted$.next(data);
    });

    this.socket.on('room:created', (data) => {
      this.roomCreated$.next(data);
    });

    this.socket.on('room:member-joined', (data) => {
      this.memberJoined$.next(data);
    });

    this.socket.on('room:member-left', (data) => {
      this.memberLeft$.next(data);
    });
  }

  disconnect() {
    if (this.socket) this.socket.disconnect();
  }

  joinRoom(roomId: string) {
    this.socket.emit('room:join', roomId);
  }

  leaveRoom(roomId: string) {
    this.socket.emit('room:leave', roomId);
  }

  sendMessage(roomId: string, content: string, replyTo?: string) {
    this.socket.emit('message:send', { roomId, content, replyTo });
  }

  editMessage(messageId: string, roomId: string, content: string) {
    this.socket.emit('message:edit', { messageId, roomId, content });
  }

  deleteMessage(messageId: string, roomId: string) {
    this.socket.emit('message:delete', { messageId, roomId });
  }

  getMessages(roomId: string, page = 1) {
    return this.http.get<any>(`${this.apiUrl}/messages/${roomId}?page=${page}`);
  }

  setAfk(isAfk: boolean) {
    if (this.socket) this.socket.emit('presence:afk', isAfk);
  }
}
