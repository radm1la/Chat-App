import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { Subscription } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-personal-chat',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './personal-chat.html',
  styleUrl: './personal-chat.css',
})
export class PersonalChatComponent implements OnInit, AfterViewChecked, OnDestroy, OnChanges {
  @Input() user: any;
  @Output() closed = new EventEmitter<void>();
  @ViewChild('messagesArea') messagesArea!: ElementRef;

  currentUser: any;
  chatId: string = '';
  messages: any[] = [];
  messageText = '';
  editingMessage: any = null;
  hasMoreMessages = false;
  currentPage = 1;
  selectedFile: File | null = null;
  private shouldScrollToBottom = true;
  private subscription!: Subscription;
  private deletedSubscription!: Subscription;
  replyingTo: any = null;
  showEmojiPicker = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private chatService: ChatService,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.initChat();
    import('emoji-picker-element');

    this.subscription = this.chatService.newMessage$.subscribe((message) => {
      if (message.chat_id === this.chatId) {
        const exists = this.messages.find((m) => m.id === message.id);
        if (!exists) {
          this.messages.push(message);
          this.shouldScrollToBottom = true;
        }
      }
    });

    this.deletedSubscription = this.chatService.personalMessageDeleted$.subscribe((data) => {
      this.messages = this.messages.filter((m) => m.id !== data.messageId);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && !changes['user'].firstChange) {
      this.messages = [];
      this.chatId = '';
      this.currentPage = 1;
      this.messageText = '';
      this.editingMessage = null;
      this.selectedFile = null;
      this.initChat();
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.deletedSubscription?.unsubscribe();
  }

  initChat() {
    this.http
      .post<any>(`${environment.apiUrl}/personal/chat/${this.user.id}`, {})
      .subscribe((chat) => {
        this.chatId = chat.id;
        this.loadMessages();
      });
  }

  loadMessages() {
    this.http
      .get<any>(
        `${environment.apiUrl}/personal/chat/${this.chatId}/messages?page=${this.currentPage}`,
      )
      .subscribe((res) => {
        this.messages = res.messages;
        this.hasMoreMessages = res.total > this.messages.length;
        this.shouldScrollToBottom = true;
      });
  }

  loadMore() {
    this.currentPage++;
    this.http
      .get<any>(
        `${environment.apiUrl}/personal/chat/${this.chatId}/messages?page=${this.currentPage}`,
      )
      .subscribe((res) => {
        this.messages = [...res.messages, ...this.messages];
        this.hasMoreMessages = res.total > this.messages.length;
      });
  }

  sendMessage() {
    if (this.selectedFile) {
      this.uploadFile();
      return;
    }

    if (!this.messageText.trim()) return;

    if (this.editingMessage) {
      this.http
        .patch<any>(`${environment.apiUrl}/personal/message/${this.editingMessage.id}`, {
          content: this.messageText,
        })
        .subscribe((updated) => {
          const index = this.messages.findIndex((m) => m.id === this.editingMessage.id);
          if (index !== -1) this.messages[index] = updated;
          this.editingMessage = null;
          this.messageText = '';
        });
    } else {
      const text = this.messageText;
      const replyToId = this.replyingTo?.id;
      this.messageText = '';
      this.replyingTo = null;
      this.http
        .post<any>(`${environment.apiUrl}/personal/chat/${this.chatId}/messages`, {
          content: text,
          replyTo: replyToId,
        })
        .subscribe();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  uploadFile() {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http
      .post<any>(`${environment.apiUrl}/uploads/personal/${this.chatId}`, formData)
      .subscribe((attachment) => {
        this.http
          .post<any>(`${environment.apiUrl}/personal/chat/${this.chatId}/messages`, {
            content: `📎 [${attachment.file_name}](${environment.apiUrl}${attachment.file_path})`,
          })
          .subscribe();
        this.selectedFile = null;
        this.shouldScrollToBottom = true;
      });
  }

  startEdit(message: any) {
    this.editingMessage = message;
    this.messageText = message.content;
  }

  deleteMessage(message: any) {
    this.http.delete(`${environment.apiUrl}/personal/message/${message.id}`).subscribe();
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

  isImageFile(filename: string) {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  }

  openLink(url: string) {
    window.open(url, '_blank');
  }

  onEnterPress(event: Event) {
    const keyEvent = event as KeyboardEvent;
    if (!keyEvent.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  scrollToBottom() {
    try {
      this.messagesArea.nativeElement.scrollTop = this.messagesArea.nativeElement.scrollHeight;
    } catch {}
  }

  close() {
    this.closed.emit();
  }
  onPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          this.selectedFile = file;
          event.preventDefault();
        }
      }
    }
  }

  replyTo(message: any) {
    this.replyingTo = message;
  }

  scrollToMessage(messageId: string) {
    const element = document.getElementById('pmsg-' + messageId);
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
