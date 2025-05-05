import { Component, inject, computed, Signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

import {
  DocumentReference,
  Firestore,
  doc,
  docData,
} from '@angular/fire/firestore';
import { filter, map, switchMap, catchError } from 'rxjs/operators';
import { combineLatest, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { FlatService, Flat } from '../../../services/flat.service';
import { MessageService, Message } from '../../../services/message.service';
import { AuthService, UserProfile } from '../../../services/auth.service';
import { ChatService, ChatPreview } from '../../../services/chat.service';

interface EnrichedMessage extends Message {
  senderName: string;
  senderEmail: string;
}

@Component({
  selector: 'app-flat-view',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './flat-view.component.html',
  styleUrl: './flat-view.component.css',
})
export class FlatViewComponent {
  private route = inject(ActivatedRoute);
  private flatService = inject(FlatService);
  private msgService = inject(MessageService);
  private chatService = inject(ChatService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private db = inject(Firestore);
  private location = inject(Location);

  private flatId = this.route.snapshot.paramMap.get('id')!;
  private flat$ = this.flatService.getFlat(this.flatId);

  flatSignal = toSignal(this.flat$, { initialValue: null });

  userSignal = toSignal(this.auth.currentUser$, { initialValue: null });

  isOwner = computed(() => {
    const f = this.flatSignal();
    const u = this.userSignal();
    return !!f && !!u && f.ownerUID === u.uid;
  });

  ownerSignal = toSignal(
    this.flat$.pipe(
      filter((f): f is Flat & { id: string } => f !== null),
      switchMap((f) => {
        const ref = doc(
          this.db,
          'users',
          f.ownerUID
        ) as DocumentReference<UserProfile>;
        return docData<UserProfile>(ref, { idField: 'uid' });
      })
    ),
    { initialValue: null }
  );
  ownerName = computed(() => {
    const o = this.ownerSignal();
    return o ? `${o.firstName} ${o.lastName}` : '';
  });

  private myChats$ = this.auth.currentUser$.pipe(
    filter((u) => !!u),
    switchMap((u) => this.chatService.listenChatsForUser(u!.uid))
  );
  chatsSignal = toSignal(this.myChats$, { initialValue: [] as ChatPreview[] });

  hasChat = computed(() =>
    this.chatsSignal().some((c) => c.flatId === this.flatId)
  );

  chatId = computed(
    () => this.chatsSignal().find((c) => c.flatId === this.flatId)?.chatId
  );

  readonly defaultMessage = 'Hi, is this available?';
  msgForm = this.fb.group({
    content: [this.defaultMessage, Validators.required],
  });

  private ownerMessages$ = combineLatest([
    this.auth.currentUser$.pipe(filter((u): u is UserProfile => !!u)),
    this.flat$.pipe(filter((f): f is Flat & { id: string } => !!f)),
  ]).pipe(
    switchMap(([user, flat]) =>
      user.uid === flat.ownerUID
        ? this.msgService.getMessages(this.flatId)
        : of([] as Message[])
    )
  );

  private enrichedMessages$ = this.ownerMessages$.pipe(
    switchMap((msgs) => {
      if (msgs.length === 0) return of<EnrichedMessage[]>([]);
      const withProfile$ = msgs.map((msg) => {
        const ref = doc(
          this.db,
          'users',
          msg.senderUID
        ) as DocumentReference<UserProfile>;
        return docData<UserProfile>(ref, { idField: 'uid' }).pipe(
          filter((u) => !!u),
          map((u) => ({
            ...msg,
            senderName: `${u.firstName} ${u.lastName}`,
            senderEmail: u.email,
          })),
          catchError(() =>
            of<EnrichedMessage>({
              ...msg,
              senderName: 'Unknown',
              senderEmail: '',
            })
          )
        );
      });
      return combineLatest(withProfile$);
    })
  );
  messagesSignal: Signal<EnrichedMessage[]> = toSignal(this.enrichedMessages$, {
    initialValue: [],
  });

  sent = false;

  async sendMessage() {
    const content = this.msgForm.value.content?.trim();
    if (!content) return;

    const ownerUID = this.flatSignal()!.ownerUID;
    const chatId = await this.chatService.getOrCreateChat(
      this.flatId,
      ownerUID
    );

    await this.chatService.sendMessage(chatId, content);

    this.sent = true;
  }

  private toDate(ts: any): Date {
    if (ts instanceof Date) return ts;
    if (ts?.toDate) return ts.toDate();
    return new Date(0);
  }
  formatDate(ts?: any) {
    const d = this.toDate(ts);
    return d
      ? new Intl.DateTimeFormat('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(d)
      : '';
  }

  edit() {
    this.router.navigate(['/flats', this.flatId, 'edit']);
  }
  viewOwnerProfile() {
    this.router.navigate(['/users', this.flatSignal()!.ownerUID]);
  }
  goBack() {
    this.location.back();
  }
}
