import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, switchMap, map, of, firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);

  favorites$: Observable<string[]> = this.auth.currentUser$.pipe(
    switchMap((user) => {
      if (!user) return of([]);

      const favCol = collection(this.firestore, 'users', user.uid, 'favorites');

      return collectionData(favCol, { idField: 'flatId' }).pipe(
        map((docs) => (docs as Array<{ flatId: string }>).map((d) => d.flatId))
      );
    })
  );

  async addFavorite(flatId: string): Promise<void> {
    const user = await firstValueFrom(this.auth.currentUser$);
    if (!user) throw new Error('Not authenticated');
    const favRef = doc(this.firestore, 'users', user.uid, 'favorites', flatId);
    await setDoc(favRef, { addedAt: serverTimestamp() });
  }

  async removeFavorite(flatId: string): Promise<void> {
    const user = await firstValueFrom(this.auth.currentUser$);
    if (!user) throw new Error('Nor authenticated');
    const favRef = doc(this.firestore, 'users', user.uid, 'favorites', flatId);
    await deleteDoc(favRef);
  }

  async isFavorite(flatId: string): Promise<boolean> {
    const user = await firstValueFrom(this.auth.currentUser$);
    if (!user) return false;
    const favRef = doc(this.firestore, 'users', user.uid, 'favorites', flatId);
    const snap = await getDoc(favRef);
    return snap.exists();
  }
}
