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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { toSignal } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs/operators';
import { combineLatest, of } from 'rxjs';

import {
  Firestore,
  doc,
  docData,
  DocumentReference,
} from '@angular/fire/firestore';
import { FlatService, Flat } from '../../../services/flat.service';
import { AuthService, UserProfile } from '../../../services/auth.service';
import {
  ChatService,
  ChatMessage,
  ChatPreview,
} from '../../../services/chat.service';

interface EnrichedMessage extends ChatMessage {
  senderName: string;
  senderEmail: string;
}

@Component({
  selector: 'app-flat-view',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  templateUrl: './flat-view.component.html',
  styleUrl: './flat-view.component.css',
})
export class FlatViewComponent {
  private route = inject(ActivatedRoute);
  private flatService = inject(FlatService);
  private chatService = inject(ChatService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  public router = inject(Router);
  private db = inject(Firestore);
  private location = inject(Location);
  private snackBar = inject(MatSnackBar);

  private flatId = this.route.snapshot.paramMap.get('id')!;
  private flat$ = this.flatService.getFlat(this.flatId);

  flatSignal = toSignal(this.flat$, { initialValue: null });
  userSignal = toSignal(this.auth.currentUser$, { initialValue: null });

  isOwner = computed(() => {
    const u = this.userSignal(),
      f = this.flatSignal();
    return !!u && !!f && u.uid === f.ownerUID;
  });

  ownerSignal = toSignal(
    this.flat$.pipe(
      filter((f): f is Flat & { id: string } => !!f),
      switchMap((f) => {
        const ref = doc(
          this.db,
          'users',
          f.ownerUID
        ) as DocumentReference<UserProfile>;
        return docData(ref, { idField: 'uid' });
      })
    ),
    { initialValue: null }
  );
  ownerName = computed(() => {
    const o = this.ownerSignal();
    return o ? `${o.firstName} ${o.lastName}` : '';
  });

  private myChats$ = this.auth.currentUser$.pipe(
    filter((u): u is UserProfile => !!u),
    switchMap((u) => this.chatService.listenChatsForUser(u.uid))
  );
  chatsSignal = toSignal(this.myChats$, { initialValue: [] as ChatPreview[] });

  hasChat = computed(() => {
    const chats = this.chatsSignal() ?? [];
    return chats.some((c) => c.flatId === this.flatId);
  });

  chatId = computed(() => {
    const chats = this.chatsSignal() ?? [];
    return chats.find((c) => c.flatId === this.flatId)?.chatId ?? null;
  });

  private ownerMessages$ = combineLatest([
    this.auth.currentUser$.pipe(filter((u): u is UserProfile => !!u)),
    this.flat$.pipe(filter((f): f is Flat & { id: string } => !!f)),
  ]).pipe(
    switchMap(([user, flat]) =>
      user.uid === flat.ownerUID
        ? this.chatService.listenMessages(this.chatId()!)
        : of([] as ChatMessage[])
    )
  );
  private enrichedMessages$ = this.ownerMessages$.pipe(
    switchMap((msgs) => {
      if (msgs.length === 0) return of<EnrichedMessage[]>([]);
      return combineLatest(
        msgs.map((msg) => {
          const ref = doc(
            this.db,
            'users',
            msg.senderUID
          ) as DocumentReference<UserProfile>;
          return docData(ref, { idField: 'uid' }).pipe(
            filter((u): u is UserProfile => !!u),
            switchMap((u) =>
              of<EnrichedMessage>({
                ...msg,
                senderName: `${u.firstName} ${u.lastName}`,
                senderEmail: u.email,
              })
            )
          );
        })
      );
    })
  );
  messagesSignal: Signal<EnrichedMessage[]> = toSignal(this.enrichedMessages$, {
    initialValue: [],
  });

  readonly defaultMessage = 'Hi, is this available?';
  msgForm = this.fb.group({
    content: [this.defaultMessage, Validators.required],
  });
  sent = false;

  async sendMessage() {
    if (this.msgForm.invalid) return;
    const content = this.msgForm.value.content!.trim();
    const ownerUID = this.flatSignal()!.ownerUID;
    const id = await this.chatService.getOrCreateChat(this.flatId, ownerUID);
    await this.chatService.sendMessage(id, content);
    this.sent = true;

    this.snackBar.open('Your message has been sent!', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['bg-green-600', 'text-white'],
    });
  }

  goToChat() {
    const id = this.chatId();
    if (id) this.router.navigate(['/chat', id]);
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

  private toDate(ts: any): Date {
    if (ts instanceof Date) return ts;
    return ts?.toDate?.() ?? new Date(0);
  }
  formatDate(ts?: any): string {
    const d = this.toDate(ts);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  }
}
