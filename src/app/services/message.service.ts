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
import { AuthService } from './auth.service';
import { Observable, firstValueFrom } from 'rxjs';

export interface Message {
  id?: string;
  senderUID: string;
  senderName: string;
  senderEmail: string;
  content: string;
  createdAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);

  async sendMessage(flatId: string, content: string): Promise<string> {
    const user = await firstValueFrom(this.auth.currentUser$);
    if (!user) throw new Error('Not authenticated');
    const messagesCol = collection(this.firestore, 'flats', flatId, 'messages');
    const docRef = await addDoc(messagesCol, {
      senderUID: user.uid,
      senderName: `${user.firstName} ${user.lastName}`,
      senderEmail: user.email,
      content,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  getMessages(flatId: string): Observable<Message[]> {
    const messagesCol = collection(this.firestore, 'flats', flatId, 'messages');
    const q = query(messagesCol, orderBy('createdAt', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Message[]>;
  }

  async deleteMessage(flatId: string, msgId: string) {
    const docRef = doc(this.firestore, 'flats', flatId, 'messages', msgId);
    await deleteDoc(docRef);
  }
}
