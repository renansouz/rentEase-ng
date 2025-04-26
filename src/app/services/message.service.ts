import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  doc,
  deleteDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Message {
  senderUID: string;
  content: string;
  createdAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  private firestore = inject(Firestore);

  async sendMessage(
    flatId: string,
    message: Omit<Message, 'createdAt'>
  ): Promise<string> {
    const messagesCol = collection(this.firestore, 'flats', flatId, 'messages');
    const docRef = await addDoc(messagesCol, {
      ...message,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  getMessages(flatId: string): Observable<Array<Message & { id: string }>> {
    const messagesCol = collection(this.firestore, 'flats', flatId, 'messages');
    const q = query(messagesCol, orderBy('createdAt', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<
      Array<Message & { id: string }>
    >;
  }

  async deleteMessage(flatId: string, messageId: string): Promise<void> {
    const docRef = doc(this.firestore, 'flats', flatId, 'messages', messageId);
    await deleteDoc(docRef);
  }
}
