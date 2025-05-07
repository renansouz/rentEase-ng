import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  AfterViewChecked,
  ViewChild,
  ElementRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatIcon } from '@angular/material/icon';

import { ChatService, ChatMessage } from '../../../services/chat.service';
import { AuthService, UserProfile } from '../../../services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-chat-window',
  imports: [CommonModule, ReactiveFormsModule, MatIcon],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.css',
})
export class ChatWindowComponent
  implements OnInit, AfterViewChecked, OnDestroy
{
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private chatSvc = inject(ChatService);
  private route = inject(ActivatedRoute);

  private sub = new Subscription();
  chatId: string | null = null;
  messages = signal<ChatMessage[]>([]);

  private prevLen = 0;

  @ViewChild('scrollContainer', { static: false })
  private scrollContainer!: ElementRef<HTMLDivElement>;

  currentUserId = toSignal(
    this.auth.currentUser$.pipe(
      filter((u): u is UserProfile => u !== null),
      map((u) => u.uid)
    ),
    { initialValue: null }
  );

  form = this.fb.group({
    content: ['', Validators.required],
  });

  ngOnInit() {
    this.sub.add(
      this.route.paramMap
        .pipe(
          map((params) => params.get('chatId')),
          filter((id): id is string => id !== null)
        )
        .subscribe((id) => {
          this.chatId = id;
          this.sub.add(
            this.chatSvc
              .listenMessages(id)
              .subscribe((msgs) => this.messages.set(msgs))
          );
          this.chatSvc.markAsRead(id);
          this.form.reset();
        })
    );
  }

  ngAfterViewChecked() {
    const msgs = this.messages();
    if (msgs.length !== this.prevLen && this.scrollContainer) {
      this.prevLen = msgs.length;
      setTimeout(() => {
        const el = this.scrollContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      });
    }
  }

  async send() {
    if (this.form.invalid || !this.chatId) return;
    await this.chatSvc.sendMessage(this.chatId, this.form.value.content!);
    this.form.reset();
  }

  handleEnter(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
