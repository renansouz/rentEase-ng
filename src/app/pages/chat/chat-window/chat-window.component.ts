import {
  Component,
  inject,
  AfterViewChecked,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { ChatService, ChatMessage, Chat } from '../../../services/chat.service';
import { AuthService, UserProfile } from '../../../services/auth.service';
import { doc, docData, Firestore } from '@angular/fire/firestore';
import { Flat, FlatService } from '../../../services/flat.service';

@Component({
  selector: 'app-chat-window',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, RouterModule],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.css',
})
export class ChatWindowComponent implements AfterViewChecked {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);
  private chatSvc = inject(ChatService);
  private route = inject(ActivatedRoute);
  private afs = inject(Firestore);
  private flatSvc = inject(FlatService);

  private chatId$: Observable<string> = this.route.paramMap.pipe(
    map((pm) => pm.get('chatId')),
    filter((id): id is string => !!id)
  );
  chatId = toSignal(this.chatId$, { initialValue: null });

  private messages$: Observable<ChatMessage[]> = this.chatId$.pipe(
    tap((id) => void this.chatSvc.markAsRead(id).catch(console.error)),
    switchMap((id) => this.chatSvc.listenMessages(id))
  );
  messages = toSignal(this.messages$, { initialValue: [] });

  private chatDoc$: Observable<Chat> = this.chatId$.pipe(
    switchMap(
      (id) =>
        docData(doc(this.afs, 'chats', id), {
          idField: 'id',
        }) as Observable<Chat>
    )
  );

  private flat$: Observable<Flat & { id: string }> = this.chatDoc$.pipe(
    map((chat) => chat.flatId),
    switchMap((flatId) => this.flatSvc.getFlat(flatId))
  );
  flatSignal = toSignal(this.flat$, { initialValue: null });

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

  @ViewChild('scrollContainer', { static: false })
  private scrollContainer!: ElementRef<HTMLDivElement>;

  private prevLen = 0;

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
    const id = this.chatId();
    const content = this.form.value.content?.trim();
    if (!id || !content) return;
    await this.chatSvc.sendMessage(id, content);
    this.form.reset();
  }

  handleEnter(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  goBack() {
    this.router.navigate(['/chat']);
  }
}
