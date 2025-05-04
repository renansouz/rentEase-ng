import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  query,
  where,
  orderBy,
  addDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { firstValueFrom, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Chat {
  id: string;
  flatId: string;
  participantsUIDs: string[];
  createdAt: any;
  lastMessageAt: any;
}

export interface ChatPreview {
  chatId: string;
  flatId: string;
  otherUID: string;
  lastMessageAt: any;
}

export interface ChatMessage {
  id: string;
  senderUID: string;
  senderName: string;
  senderEmail: string;
  content: string;
  createdAt: any;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);

  async getOrCreateChat(flatId: string, otherUID: string): Promise<string> {
    const me = (await firstValueFrom(this.auth.currentUser$))?.uid;
    if (!me) throw new Error('Not authenticated');

    const chatsCol = collection(this.firestore, 'chats');
    const q = query(
      chatsCol,
      where('flatId', '==', flatId),
      where('participantsUIDs', 'array-contains-any', [me])
    );
    const existing = await firstValueFrom(
      collectionData(q, { idField: 'id' }) as Observable<Chat[]>
    );
    const found = existing.find(
      (c) =>
        c.participantsUIDs.includes(me) && c.participantsUIDs.includes(otherUID)
    );
    if (found) return found.id;

    const chatRef = await addDoc(chatsCol, {
      flatId,
      participantsUIDs: [me, otherUID],
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
    });

    const participantsCol = collection(
      this.firestore,
      `chats/${chatRef.id}/participants`
    );
    await setDoc(doc(participantsCol, me), { lastReadAt: serverTimestamp() });
    await setDoc(doc(participantsCol, otherUID), { lastReadAt: null });

    return chatRef.id;
  }

  listenChatsForUser(uid: string): Observable<ChatPreview[]> {
    const chatsCol = collection(this.firestore, 'chats');
    const q = query(
      chatsCol,
      where('participantsUIDs', 'array-contains', uid),
      orderBy('lastMessageAt', 'desc')
    );
    return collectionData(q, { idField: 'id' }).pipe(
      map((docs: any[]) =>
        docs.map(
          (d) =>
            ({
              chatId: d.id,
              flatId: d.flatId,
              otherUID: d.participantsUIDs.find((p: string) => p !== uid),
              lastMessageAt: d.lastMessageAt,
            } as ChatPreview)
        )
      )
    );
  }

  listenMessages(chatId: string): Observable<ChatMessage[]> {
    const msgsCol = collection(this.firestore, `chats/${chatId}/messages`);
    const q = query(msgsCol, orderBy('createdAt', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<ChatMessage[]>;
  }

  async sendMessage(chatId: string, content: string): Promise<void> {
    const user = await firstValueFrom(this.auth.currentUser$);
    if (!user) throw new Error('Not authenticated');

    const msgsCol = collection(this.firestore, `chats/${chatId}/messages`);
    await addDoc(msgsCol, {
      senderUID: user.uid,
      senderName: `${user.firstName} ${user.lastName}`,
      senderEmail: user.email,
      content,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(this.firestore, 'chats', chatId), {
      lastMessageAt: serverTimestamp(),
    });

    await updateDoc(
      doc(this.firestore, `chats/${chatId}/participants`, user.uid),
      { lastReadAt: serverTimestamp() }
    );
  }

  async markAsRead(chatId: string): Promise<void> {
    const user = await firstValueFrom(this.auth.currentUser$);
    if (!user) return;
    await updateDoc(
      doc(this.firestore, `chats/${chatId}/participants`, user.uid),
      { lastReadAt: serverTimestamp() }
    );
  }
}
