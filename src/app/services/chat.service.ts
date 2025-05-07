import { Injectable, inject } from '@angular/core';
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
  docData,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { combineLatest, firstValueFrom, Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

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
  lastReadAt: any;
  unreadMessagesCount: number;
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
      where('participantsUIDs', 'in', [
        [me, otherUID],
        [otherUID, me],
      ])
    );
    const existing = await firstValueFrom(
      collectionData(q, { idField: 'id' }) as Observable<Chat[]>
    );
    if (existing[0]) return existing[0].id;

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
    const chatsQ = query(
      chatsCol,
      where('participantsUIDs', 'array-contains', uid),
      orderBy('lastMessageAt', 'desc')
    );

    return collectionData(chatsQ, { idField: 'id' }).pipe(
      switchMap((chats: any[]) => {
        const streams = chats.map((chat) => {
          const chatId = chat.id as string;
          const flatId = chat.flatId as string;
          const otherUID = (chat.participantsUIDs as string[]).find(
            (p) => p !== uid
          )!;
          const lastMsgAt = chat.lastMessageAt;

          const partDoc = doc(
            this.firestore,
            `chats/${chatId}/participants/${uid}`
          );
          const lastRead$ = docData(partDoc).pipe(
            map((p: any | undefined) => p?.lastReadAt ?? null),
            catchError(() => [null])
          );

          const msgsCol = collection(
            this.firestore,
            `chats/${chatId}/messages`
          );

          return lastRead$.pipe(
            switchMap((lastReadAt) => {
              const msgsQ = lastReadAt
                ? query(msgsCol, where('createdAt', '>', lastReadAt))
                : query(msgsCol, orderBy('createdAt'));
              return collectionData(msgsQ).pipe(
                map(
                  (msgs: any[]) =>
                    ({
                      chatId,
                      flatId,
                      otherUID,
                      lastMessageAt: lastMsgAt,
                      lastReadAt,
                      unreadMessagesCount: msgs.length,
                    } as ChatPreview)
                )
              );
            })
          );
        });

        return combineLatest(streams);
      })
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
      senderName: `${user.firstName} ${user.lastName}`.trim(),
      senderEmail: user.email ?? '',
      content,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(this.firestore, 'chats', chatId), {
      lastMessageAt: serverTimestamp(),
    });
  }

  async markAsRead(chatId: string): Promise<void> {
    const user = await firstValueFrom(this.auth.currentUser$);
    if (!user) return;
    const partDoc = doc(
      this.firestore,
      `chats/${chatId}/participants/${user.uid}`
    );
    try {
      await updateDoc(partDoc, { lastReadAt: serverTimestamp() });
    } catch {}
  }
}
