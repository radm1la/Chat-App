import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { RoomsService } from '../../services/rooms.service';
import { Subscription } from 'rxjs';
import { PresenceService } from '../../services/presence';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, SlicePipe],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesArea') messagesArea!: ElementRef;

  currentUser: any;
  myRooms: any[] = [];
  publicRooms: any[] = [];
  selectedRoom: any = null;
  messages: any[] = [];
  roomMembers: any[] = [];
  roomSearch = '';
  messageText = '';
  replyingTo: any = null;
  editingMessage: any = null;
  showCreateRoom = false;
  hasMoreMessages = false;
  currentPage = 1;
  unreadCounts: { [key: string]: number } = {};
  presenceMap: { [key: string]: string } = {};
  private shouldScrollToBottom = true;
  private subscriptions: Subscription[] = [];

  newRoom = {
    name: '',
    description: '',
    isPrivate: false,
  };

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private roomsService: RoomsService,
    private presenceService: PresenceService,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.chatService.connect();
    this.presenceService.startTracking();
    this.loadMyRooms();
    this.loadPublicRooms();

    this.subscriptions.push(
      this.chatService.newMessage$.subscribe((message) => {
        if (this.selectedRoom && message.room_id === this.selectedRoom.id) {
          this.messages.push(message);
          this.shouldScrollToBottom = true;
        } else {
          this.unreadCounts[message.room_id] = (this.unreadCounts[message.room_id] || 0) + 1;
        }
      }),

      this.chatService.presenceUpdates$.subscribe((data) => {
        this.presenceMap[data.userId] = data.status;
      }),
    );
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    this.chatService.disconnect();
    this.presenceService.stopTracking();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  loadMyRooms() {
    this.roomsService.getMyRooms().subscribe((rooms) => {
      this.myRooms = rooms;
    });
  }

  loadPublicRooms() {
    this.roomsService.getPublicRooms().subscribe((rooms) => {
      this.publicRooms = rooms;
    });
  }

  searchRooms() {
    this.roomsService.getPublicRooms(this.roomSearch).subscribe((rooms) => {
      this.publicRooms = rooms;
    });
  }

  selectRoom(room: any) {
    if (this.selectedRoom) {
      this.chatService.leaveRoom(this.selectedRoom.id);
    }
    this.selectedRoom = room;
    this.messages = [];
    this.currentPage = 1;
    this.unreadCounts[room.id] = 0;
    this.chatService.joinRoom(room.id);
    this.loadMessages();
    this.loadMembers();
  }

  joinAndSelectRoom(room: any) {
    this.roomsService.joinRoom(room.id).subscribe({
      next: () => {
        this.loadMyRooms();
        this.selectRoom(room);
      },
      error: () => {
        this.selectRoom(room);
      },
    });
  }

  loadMessages() {
    this.chatService.getMessages(this.selectedRoom.id, this.currentPage).subscribe((res) => {
      this.messages = res.messages;
      this.hasMoreMessages = res.total > this.messages.length;
      this.shouldScrollToBottom = true;
    });
  }

  loadMoreMessages() {
    this.currentPage++;
    this.chatService.getMessages(this.selectedRoom.id, this.currentPage).subscribe((res) => {
      this.messages = [...res.messages, ...this.messages];
      this.hasMoreMessages = res.total > this.messages.length;
    });
  }

  loadMembers() {
    this.roomsService.getRoomMembers(this.selectedRoom.id).subscribe((members) => {
      this.roomMembers = members;
    });
  }

  sendMessage() {
    if (!this.messageText.trim() || !this.selectedRoom) return;

    if (this.editingMessage) {
      this.chatService.editMessage(this.editingMessage.id, this.selectedRoom.id, this.messageText);
      this.editingMessage = null;
    } else {
      this.chatService.sendMessage(this.selectedRoom.id, this.messageText, this.replyingTo?.id);
      this.replyingTo = null;
    }

    this.messageText = '';
  }

  onEnterPress(event: Event) {
    const keyEvent = event as KeyboardEvent;
    if (!keyEvent.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  replyTo(message: any) {
    this.replyingTo = message;
  }

  startEdit(message: any) {
    this.editingMessage = message;
    this.messageText = message.content;
  }

  deleteMessage(message: any) {
    this.chatService.deleteMessage(message.id, this.selectedRoom.id);
    this.messages = this.messages.filter((m) => m.id !== message.id);
  }

  createRoom() {
    this.roomsService
      .createRoom(this.newRoom.name, this.newRoom.description, this.newRoom.isPrivate)
      .subscribe(() => {
        this.showCreateRoom = false;
        this.newRoom = { name: '', description: '', isPrivate: false };
        this.loadMyRooms();
      });
  }

  getPresenceStatus(userId: string) {
    return this.presenceMap[userId] || 'offline';
  }

  onScroll(event: any) {
    const element = event.target;
    const atBottom = element.scrollHeight - element.scrollTop === element.clientHeight;
    this.shouldScrollToBottom = atBottom;
  }

  scrollToBottom() {
    try {
      this.messagesArea.nativeElement.scrollTop = this.messagesArea.nativeElement.scrollHeight;
    } catch {}
  }

  logout() {
    this.chatService.disconnect();
    this.authService.logout();
  }
}
