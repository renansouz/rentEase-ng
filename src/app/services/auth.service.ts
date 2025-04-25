import { Injectable, inject } from '@angular/core';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  docData,
  setDoc,
  deleteDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  isAdmin?: boolean;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  currentUser$: Observable<UserProfile | null> = authState(this.auth).pipe(
    switchMap((user: User | null) => {
      if (!user) return of(null);
      const ref = doc(this.firestore, 'users', user.uid);
      return docData(ref, { idField: 'uid' }) as Observable<UserProfile>;
    })
  );

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    birthDate: Date
  ): Promise<void> {
    this.loadingSubject.next(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const uid = cred.user.uid;

      await setDoc(doc(this.firestore, 'users', uid), {
        email,
        firstName,
        lastName,
        birthDate,
        isAdmin: false,
        createdAt: new Date(),
      });
      await this.router.navigate(['/']);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async login(email: string, password: string): Promise<void> {
    this.loadingSubject.next(true);
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      await this.router.navigate(['/']);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async logout(): Promise<void> {
    this.loadingSubject.next(true);
    try {
      await signOut(this.auth);
      await this.router.navigate(['/login']);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async deleteAccount(): Promise<void> {
    this.loadingSubject.next(true);
    try {
      const user = this.auth.currentUser;
      if (!user) return;

      await deleteDoc(doc(this.firestore, 'users', user.uid));

      await user.delete();

      await signOut(this.auth);

      await this.router.navigate(['/register'], { replaceUrl: true });
    } finally {
      this.loadingSubject.next(false);
    }
  }

  async updateProfile(
    updates: Partial<Omit<UserProfile, 'uid' | 'email'>>
  ): Promise<void> {
    this.loadingSubject.next(true);
    try {
      const user = this.auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      await updateDoc(doc(this.firestore, 'users', user.uid), updates);
    } finally {
      this.loadingSubject.next(false);
    }
  }
}
