import { Component, inject, Signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { ChatService, ChatPreview } from '../../../services/chat.service';
import { Flat, FlatService } from '../../../services/flat.service';
import { AuthService } from '../../../services/auth.service';
import { filter, switchMap } from 'rxjs';

interface EnrichedPreview extends ChatPreview {
  photoUrl: string;
  title: string;
}

@Component({
  selector: 'app-chat-list',
  imports: [CommonModule],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.css',
})
export class ChatListComponent {
  private chatSvc = inject(ChatService);
  private flatSvc = inject(FlatService);
  private auth = inject(AuthService);
  private router = inject(Router);

  chats: Signal<ChatPreview[]> = toSignal(
    this.auth.currentUser$.pipe(
      filter((u) => !!u),
      switchMap((u) => this.chatSvc.listenChatsForUser(u!.uid))
    ),
    { initialValue: [] }
  );

  allFlats: Signal<Flat[]> = toSignal(this.flatSvc.getAllFlats(), {
    initialValue: [],
  });

  flatsMap = computed(() => {
    const map: Record<string, Flat> = {};
    for (const f of this.allFlats()) {
      if (!f.id) continue;
      map[f.id] = f;
    }
    return map;
  });

  enriched: Signal<EnrichedPreview[]> = computed(() =>
    this.chats().map((c) => {
      const flat = this.flatsMap()[c.flatId];
      const photoUrl = flat?.photoUrl ?? 'fallback.png';
      const title = flat
        ? `${flat.streetNumber}, ${flat.streetName}`.slice(0, 30) + '…'
        : 'Unknown';
      return { ...c, photoUrl, title };
    })
  );

  goTo(c: EnrichedPreview) {
    this.router.navigate(['/chat', c.chatId]);
  }
}
