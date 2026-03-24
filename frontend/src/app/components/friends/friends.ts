import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ChatService } from '../../services/chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './friends.html',
  styleUrl: './friends.css',
})
export class FriendsComponent implements OnInit, OnDestroy {
  @Output() openPersonalChat = new EventEmitter<any>();

  activeTab = 'friends';
  friends: any[] = [];
  pendingRequests: any[] = [];
  pendingCount = 0;
  searchUsername = '';
  error = '';
  success = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private http: HttpClient,
    private chatService: ChatService,
  ) {}

  ngOnInit() {
    this.loadFriends();
    this.loadPending();

    this.subscriptions.push(
      this.chatService.friendRequest$.subscribe(() => {
        this.loadPending();
      }),

      this.chatService.friendAccepted$.subscribe(() => {
        this.loadFriends();
        this.loadPending();
      }),

      this.chatService.friendRemoved$.subscribe(() => {
        this.loadFriends();
      }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  loadFriends() {
    this.http.get<any[]>(`${environment.apiUrl}/friends`).subscribe((friends) => {
      this.friends = friends;
    });
  }

  loadPending() {
    this.http.get<any[]>(`${environment.apiUrl}/friends/pending`).subscribe((requests) => {
      this.pendingRequests = requests;
      this.pendingCount = requests.length;
    });
  }

  sendRequest() {
    this.error = '';
    this.success = '';
    this.http
      .post(`${environment.apiUrl}/friends/request`, { username: this.searchUsername })
      .subscribe({
        next: () => {
          this.success = 'Friend request sent!';
          this.searchUsername = '';
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to send request';
        },
      });
  }

  acceptRequest(request: any) {
    this.http.post(`${environment.apiUrl}/friends/accept/${request.id}`, {}).subscribe(() => {
      this.loadFriends();
      this.loadPending();
    });
  }

  declineRequest(request: any) {
    this.http.post(`${environment.apiUrl}/friends/decline/${request.id}`, {}).subscribe(() => {
      this.loadPending();
    });
  }

  removeFriend(friend: any) {
    this.http.delete(`${environment.apiUrl}/friends/${friend.user.id}`).subscribe(() => {
      this.loadFriends();
    });
  }

  openChat(friend: any) {
    this.openPersonalChat.emit(friend.user);
  }
}
