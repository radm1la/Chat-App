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
import { SettingsComponent } from '../settings/settings';
import { FriendsComponent } from '../friends/friends';
import { PersonalChatComponent } from '../personal-chat/personal-chat';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-chat',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    SlicePipe,
    SettingsComponent,
    FriendsComponent,
    PersonalChatComponent,
  ],
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
  private isAtBottom = true;
  private subscriptions: Subscription[] = [];
  showSettings = false;
  sidebarTab = 'rooms';
  activePersonalChat: any = null;
  selectedFile: File | null = null;
  selectedMember: any = null;
  showBannedUsers = false;
  bannedUsers: any[] = [];
  inviteUsername = '';
  inviteSuccess = '';
  inviteError = '';
  createRoomError = '';
  unreadPersonalCounts: { [key: string]: number } = {};
  pendingFriendRequests = 0;
  friendRequestSuccess = '';
  friendRequestError = '';
  friendNotifications = 0;
  showEmojiPicker = false;

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
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.chatService.connect();
    this.presenceService.startTracking();
    this.loadMyRooms();
    this.loadPublicRooms();
    import('emoji-picker-element');

    this.subscriptions.push(
      this.chatService.newMessage$.subscribe((message) => {
        if (message.room_id) {
          // Room message
          if (this.selectedRoom && message.room_id === this.selectedRoom.id) {
            this.messages.push(message);
            if (this.isAtBottom || message.sender_id === this.currentUser?.id) {
              this.shouldScrollToBottom = true;
            }
          } else {
            this.unreadCounts[message.room_id] = (this.unreadCounts[message.room_id] || 0) + 1;
          }
        } else if (message.chat_id) {
          // Personal message - only count if we are the receiver, not the sender
          if (message.sender_id !== this.currentUser?.id) {
            if (!this.activePersonalChat || this.activePersonalChat.id !== message.sender_id) {
              const senderId = message.sender_id;
              this.unreadPersonalCounts[senderId] = (this.unreadPersonalCounts[senderId] || 0) + 1;
            }
          }
        }
      }),

      this.chatService.presenceUpdates$.subscribe((data) => {
        this.presenceMap[data.userId] = data.status;
      }),

      this.chatService.friendRequest$.subscribe(() => {
        this.pendingFriendRequests++;
      }),

      this.chatService.friendAccepted$.subscribe(() => {
        this.friendNotifications++;
      }),

      this.chatService.memberCountUpdates$.subscribe((data) => {
        if (this.selectedRoom && data.roomId === this.selectedRoom.id) {
          this.selectedRoom.memberCount = data.memberCount;
        }
        // Also update the room in myRooms and publicRooms if it exists there
        const myRoom = this.myRooms.find((r) => r.room?.id === data.roomId);
        if (myRoom) myRoom.room.memberCount = data.memberCount;
        const publicRoom = this.publicRooms.find((r) => r.id === data.roomId);
        if (publicRoom) publicRoom.memberCount = data.memberCount;
      }),

      this.chatService.userBanned$.subscribe((data) => {
        // Remove the banned room from user's room list
        this.myRooms = this.myRooms.filter((r) => r.room?.id !== data.roomId);

        // If the banned room is currently selected, clear it
        if (this.selectedRoom && this.selectedRoom.id === data.roomId) {
          this.selectedRoom = null;
          this.messages = [];
          this.roomMembers = [];
          this.chatService.leaveRoom(data.roomId);
        }

        // Show notification
        alert(data.message);
      }),

      this.chatService.userUnbanned$.subscribe((data) => {
        // Add the unbanned room to user's room list
        this.loadMyRooms(); // Reload to get the updated membership

        // Show notification
        alert(data.message);
      }),
      this.chatService.messageDeleted$.subscribe((data) => {
        this.messages = this.messages.filter((m) => m.id !== data.messageId);
      }),

      this.chatService.messageEdited$.subscribe((data) => {
        const index = this.messages.findIndex((m) => m.id === data.id);
        if (index !== -1) this.messages[index] = data;
      }),

      this.chatService.adminChanged$.subscribe((data) => {
        if (this.selectedRoom && data.roomId === this.selectedRoom.id) {
          this.loadMembers();
        }
      }),
      this.chatService.roomDeleted$.subscribe((data) => {
        this.myRooms = this.myRooms.filter((r) => r.room?.id !== data.roomId);
        this.publicRooms = this.publicRooms.filter((r) => r.id !== data.roomId);

        if (this.selectedRoom && this.selectedRoom.id === data.roomId) {
          this.selectedRoom = null;
          this.messages = [];
          this.roomMembers = [];
          alert('This room has been deleted.');
        }
      }),
      this.chatService.roomCreated$.subscribe((room) => {
        const exists = this.publicRooms.find((r) => r.id === room.id);
        if (!exists) {
          this.publicRooms.push(room);
        }
      }),
      this.chatService.addedToRoom$.subscribe((room) => {
        this.loadMyRooms();
      }),
      this.chatService.memberJoined$.subscribe((member) => {
        if (this.selectedRoom && member.room_id === this.selectedRoom.id) {
          const exists = this.roomMembers.find((m) => m.user_id === member.user_id);
          if (!exists) this.roomMembers.push(member);
        }
      }),

      this.chatService.memberLeft$.subscribe((data) => {
        if (this.selectedRoom) {
          this.roomMembers = this.roomMembers.filter((m) => m.user_id !== data.userId);
        }
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

  get totalFriendsNotifications() {
    const unreadPersonal = Object.values(this.unreadPersonalCounts).reduce((a, b) => a + b, 0);
    return unreadPersonal + this.pendingFriendRequests + this.friendNotifications;
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
    if (this.selectedFile) {
      this.uploadFile();
      return;
    }

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
  }

  createRoom() {
    this.createRoomError = '';
    this.roomsService
      .createRoom(this.newRoom.name, this.newRoom.description, this.newRoom.isPrivate)
      .subscribe({
        next: () => {
          this.showCreateRoom = false;
          this.newRoom = { name: '', description: '', isPrivate: false };
          this.loadMyRooms();
        },
        error: (err) => {
          this.createRoomError = err.error?.message || 'Failed to create room';
        },
      });
  }
  getPresenceStatus(userId: string) {
    return this.presenceMap[userId] || 'offline';
  }

  onScroll(event: any) {
    const element = event.target;
    this.isAtBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) <= 10;
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

  startPersonalChat(user: any) {
    this.activePersonalChat = user;
    this.unreadPersonalCounts[user.id] = 0;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const maxSize = isImage ? 3 * 1024 * 1024 : 20 * 1024 * 1024;
    const maxSizeLabel = isImage ? '3MB' : '20MB';

    if (file.size > maxSize) {
      alert(`File too large! ${isImage ? 'Images' : 'Files'} must be under ${maxSizeLabel}`);
      event.target.value = '';
      return;
    }

    this.selectedFile = file;
  }

  uploadFile() {
    if (!this.selectedFile || !this.selectedRoom) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http
      .post<any>(`${environment.apiUrl}/uploads/room/${this.selectedRoom.id}`, formData)
      .subscribe((attachment) => {
        const comment = this.messageText.trim() ? `\n${this.messageText}` : '';
        this.chatService.sendMessage(
          this.selectedRoom.id,
          `📎 [${attachment.file_name}](${environment.apiUrl}${attachment.file_path})${comment}`,
        );
        this.selectedFile = null;
        this.messageText = '';
      });
  }

  openLink(url: string) {
    window.open(url, '_blank');
  }

  isFileMessage(content: string) {
    return content?.startsWith('📎 [');
  }

  getFileName(content: string) {
    const match = content?.match(/\[(.+?)\]/);
    return match ? match[1] : '';
  }

  getFileUrl(content: string) {
    const match = content?.match(/\((.+?)\)/);
    return match ? match[1] : '';
  }

  getFileComment(content: string) {
    const lines = content?.split('\n');
    return lines && lines.length > 1 ? lines.slice(1).join('\n') : '';
  }

  isImageFile(filename: string) {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  }

  isAdminInRoom() {
    if (!this.selectedRoom || !this.currentUser) return false;
    const member = this.roomMembers.find((m) => m.user_id === this.currentUser.id);
    return member?.is_admin || false;
  }

  isOwnerOfRoom() {
    if (!this.selectedRoom || !this.currentUser) return false;
    return this.selectedRoom.owner_id === this.currentUser.id;
  }

  openMemberMenu(member: any) {
    this.selectedMember = member;
  }

  banMember(member: any) {
    this.roomsService.banMember(this.selectedRoom.id, member.user_id).subscribe(() => {
      this.selectedMember = null;
      this.loadMembers();
    });
  }

  toggleAdmin(member: any) {
    if (member.is_admin) {
      this.roomsService.removeAdmin(this.selectedRoom.id, member.user_id).subscribe(() => {
        this.selectedMember = null;
        this.loadMembers();
      });
    } else {
      this.roomsService.makeAdmin(this.selectedRoom.id, member.user_id).subscribe(() => {
        this.selectedMember = null;
        this.loadMembers();
      });
    }
  }

  loadBannedUsers() {
    this.roomsService.getBannedUsers(this.selectedRoom.id).subscribe((users) => {
      this.bannedUsers = users;
    });
  }

  unbanMember(ban: any) {
    this.roomsService.unbanMember(this.selectedRoom.id, ban.user_id).subscribe(() => {
      this.loadBannedUsers();
      this.loadMembers();
    });
  }

  confirmDeleteRoom() {
    if (confirm('Are you sure you want to delete this room?')) {
      this.roomsService.deleteRoom(this.selectedRoom.id).subscribe(() => {
        this.selectedRoom = null;
        this.messages = [];
        this.roomMembers = [];
        this.loadMyRooms();
      });
    }
  }

  isJoined(room: any) {
    return this.myRooms.some((m) => m.room?.id === room.id);
  }

  previewRoom(room: any) {
    if (this.isJoined(room)) {
      this.selectRoom(room);
    }
  }

  inviteUser() {
    this.inviteSuccess = '';
    this.inviteError = '';

    this.roomsService.inviteUser(this.selectedRoom.id, this.inviteUsername).subscribe({
      next: () => {
        this.inviteSuccess = 'User invited successfully!';
        this.inviteUsername = '';
        this.loadMembers();
        setTimeout(() => (this.inviteSuccess = ''), 3000);
      },
      error: (err) => {
        this.inviteError = err.error?.message || 'Failed to invite user';
        setTimeout(() => (this.inviteError = ''), 3000);
      },
    });
  }

  onPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          if (file.size > 3 * 1024 * 1024) {
            alert('Image too large! Images must be under 3MB');
            return;
          }
          this.selectedFile = file;
          event.preventDefault();
        }
      }
    }
  }

  leaveRoom() {
    if (!confirm('Are you sure you want to leave this room?')) return;

    this.roomsService.leaveRoom(this.selectedRoom.id).subscribe({
      next: () => {
        this.selectedRoom = null;
        this.messages = [];
        this.roomMembers = [];
        this.loadMyRooms();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to leave room');
      },
    });
  }

  sendFriendRequestFromRoom(member: any) {
    this.friendRequestSuccess = '';
    this.friendRequestError = '';

    this.http
      .post(`${environment.apiUrl}/friends/request`, {
        username: member.user?.username,
      })
      .subscribe({
        next: () => {
          this.friendRequestSuccess = 'Friend request sent!';
          setTimeout(() => {
            this.friendRequestSuccess = '';
          }, 3000);
        },
        error: (err) => {
          this.friendRequestError = err.error?.message || 'Failed to send request';
          setTimeout(() => {
            this.friendRequestError = '';
          }, 3000);
        },
      });
  }

  scrollToMessage(messageId: string) {
    const element = document.getElementById('msg-' + messageId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlighted');
      setTimeout(() => element.classList.remove('highlighted'), 2000);
    }
  }

  onEmojiClick(event: any) {
    this.messageText += event.detail.unicode;
    this.showEmojiPicker = false;
  }
}
