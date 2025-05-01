import { Component, inject, computed, Signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
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
import { Message, MessageService } from '../../../services/message.service';
import { AuthService, UserProfile } from '../../../services/auth.service';

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
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private db = inject(Firestore);

  private flatId = this.route.snapshot.paramMap.get('id')!;
  private flat$ = this.flatService.getFlat(this.flatId);
  private user$ = this.auth.currentUser$.pipe(
    filter((u): u is UserProfile => u !== null)
  );
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
        const userRef = doc(
          this.db,
          'users',
          f.ownerUID
        ) as DocumentReference<UserProfile>;

        return docData<UserProfile>(userRef, { idField: 'uid' });
      })
    ),
    { initialValue: null }
  );

  ownerName = computed(() => {
    const o = this.ownerSignal();
    return o ? `${o.firstName} ${o.lastName}` : '';
  });

  readonly defaultMessage = 'Hi, is this available?';

  msgForm = this.fb.group({
    content: [this.defaultMessage, Validators.required],
  });
  private ownerMessages$ = combineLatest([this.user$, this.flat$]).pipe(
    switchMap(([user, flat]) =>
      user.uid === flat.ownerUID
        ? this.msgService.getMessages(this.flatId)
        : of([] as Message[])
    )
  );

  private enrichedMessages$ = this.ownerMessages$.pipe(
    switchMap((msgs) => {
      if (msgs.length === 0) {
        return of<EnrichedMessage[]>([]);
      }
      const withProfile$ = msgs.map((msg) => {
        const senderRef = doc(
          this.db,
          'users',
          msg.senderUID
        ) as DocumentReference<UserProfile>;

        return docData<UserProfile>(senderRef, { idField: 'uid' }).pipe(
          filter((u): u is UserProfile => u !== undefined),
          map((u) => ({
            ...msg,
            senderName: `${u.firstName} ${u.lastName}`,
            senderEmail: u.email,
          })),
          catchError(() =>
            of<EnrichedMessage>({
              ...msg,
              senderName: 'Unknown user',
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

  edit() {
    this.router.navigate(['/flats', this.flatId, 'edit']);
  }

  sent = false;

  async sendMessage() {
    const content = this.msgForm.value.content?.trim();
    if (!content) return;

    await this.msgService.sendMessage(this.flatId, content);
    this.sent = true;

    this.msgForm.disable();
    this.msgForm.patchValue({ content: '' });
  }

  private toDate(t: any): Date {
    if (t instanceof Date) return t;
    if (t?.toDate) return t.toDate();
    return new Date(0);
  }

  pending: Signal<boolean> = computed(() => {
    const msgs = this.messagesSignal();
    const me = this.userSignal()?.uid;
    if (!me) return false;
    const userMsgs = msgs.filter((m) => m.senderUID === me);
    if (userMsgs.length === 0) return false;
    const ownerMsgs = msgs.filter((m) => m.senderUID !== me);
    if (ownerMsgs.length === 0) return true;
    const lastUser = this.toDate(userMsgs.at(-1)!.createdAt);
    const lastOwner = this.toDate(ownerMsgs.at(-1)!.createdAt);
    return lastUser > lastOwner;
  });

  formatDate(ts?: any) {
    const d = ts instanceof Date ? ts : ts?.toDate?.();
    return d
      ? new Intl.DateTimeFormat('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(d)
      : '';
  }

  viewOwnerProfile() {
    this.router.navigate(['/users', this.flatSignal()!.ownerUID]);
  }
}
