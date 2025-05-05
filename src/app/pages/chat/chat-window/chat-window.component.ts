import { Component, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { ChatService, ChatMessage } from '../../../services/chat.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../services/auth.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-chat-window',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.css',
})
export class ChatWindowComponent {
  private route = inject(ActivatedRoute);
  private chatSvc = inject(ChatService);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  chatId = this.route.snapshot.paramMap.get('chatId')!;

  messages: Signal<ChatMessage[]> = toSignal(
    this.chatSvc.listenMessages(this.chatId),
    { initialValue: [] }
  );

  currentUserId: Signal<string | null> = toSignal(
    this.auth.currentUser$.pipe(map((u) => u?.uid ?? null)),
    { initialValue: null }
  );

  form = this.fb.group({
    content: ['', Validators.required],
  });

  async send() {
    if (this.form.invalid) return;
    await this.chatSvc.sendMessage(this.chatId, this.form.value.content!);
    this.form.reset();
  }
}
