import { Injectable, OnDestroy } from '@angular/core';
import { ChatService } from './chat.service';

@Injectable({ providedIn: 'root' })
export class PresenceService implements OnDestroy {
  private afkTimeout: any;
  private isAfk = false;
  private readonly AFK_TIME = 60000; // 1 minute

  private boundResetTimer: () => void;

  constructor(private chatService: ChatService) {
    this.boundResetTimer = this.resetTimer.bind(this);
  }

  startTracking() {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, this.boundResetTimer);
    });
    this.resetTimer();
  }

  stopTracking() {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.removeEventListener(event, this.boundResetTimer);
    });
    clearTimeout(this.afkTimeout);
  }

  private resetTimer() {
    clearTimeout(this.afkTimeout);

    if (this.isAfk) {
      this.isAfk = false;
      this.chatService.setAfk(false);
    }

    this.afkTimeout = setTimeout(() => {
      this.isAfk = true;
      this.chatService.setAfk(true);
    }, this.AFK_TIME);
  }

  ngOnDestroy() {
    this.stopTracking();
  }
}