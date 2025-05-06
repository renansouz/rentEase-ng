import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService, UserProfile } from '../../../services/auth.service';
import { ChatService, ChatPreview } from '../../../services/chat.service';
import { ChatListComponent } from '../chat-list/chat-list.component';
import { filter, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-chat-page',
  imports: [CommonModule, ChatListComponent, RouterOutlet],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.css',
})
export class ChatPageComponent implements OnInit {
  private auth = inject(AuthService);
  private chatSvc = inject(ChatService);
  private router = inject(Router);

  chats$: Observable<ChatPreview[]> = this.auth.currentUser$.pipe(
    filter((u): u is UserProfile => !!u),
    switchMap((u) => this.chatSvc.listenChatsForUser(u.uid))
  );

  ngOnInit() {}

  onChatSelected(id: string) {
    this.router.navigate(['/chat', id]);
  }
}
