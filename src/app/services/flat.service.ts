import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Flat {
  ownerUID: string;
  city: string;
  streetName: string;
  streetNumber: number;
  areaSize: number;
  hasAC: boolean;
  yearBuilt: number;
  rentPrice: number;
  availableDate: Date;
  createdAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class FlatService {
  private firestore = inject(Firestore);
  private flatsCollectionRef = collection(this.firestore, 'flats');

  async createFlat(flat: Omit<Flat, 'createdAt'>): Promise<string> {
    const docRef = await addDoc(this.flatsCollectionRef, {
      ...flat,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  getFlat(id: string): Observable<Flat & { id: string }> {
    const docRef = doc(this.firestore, 'flats', id);
    return docData(docRef, { idField: 'id' }) as Observable<
      Flat & { id: string }
    >;
  }

  updateFlat(
    id: string,
    updates: Partial<Omit<Flat, 'ownerUID'>>
  ): Promise<void> {
    const docRef = doc(this.firestore, 'flats', id);
    return updateDoc(docRef, updates);
  }

  deleteFlat(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'flats', id);
    return deleteDoc(docRef);
  }

  getAllFlats(): Observable<Array<Flat & { id: string }>> {
    return collectionData(this.flatsCollectionRef, {
      idField: 'id',
    }) as Observable<Array<Flat & { id: string }>>;
  }

  getFlatsByOwner(ownerUID: string): Observable<Array<Flat & { id: string }>> {
    const q = query(this.flatsCollectionRef, where('ownerUID', '==', ownerUID));
    return collectionData(q, { idField: 'id' }) as Observable<
      Array<Flat & { id: string }>
    >;
  }
}
