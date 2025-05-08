import { Injectable, inject } from '@angular/core';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
  UserCredential,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  docData,
  setDoc,
  deleteDoc,
  updateDoc,
  collectionData,
  collection,
  CollectionReference,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, map, Observable, of, switchMap } from 'rxjs';

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

  private loadingSub = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSub.asObservable();

  currentUser$: Observable<UserProfile | null> = authState(this.auth).pipe(
    switchMap((user: User | null) => {
      if (!user) return of(null);
      const ref = doc(this.firestore, 'users', user.uid);
      return docData(ref, { idField: 'uid' }) as Observable<UserProfile>;
    })
  );

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.setLoginTimestamp();
        this.startAutoLogoutTimer();
      }
    });
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    birthDate: Date
  ): Promise<void> {
    this.loadingSub.next(true);
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
      this.loadingSub.next(false);
    }
  }

  async login(email: string, password: string) {
    this.loadingSub.next(true);
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      this.setLoginTimestamp();
      await this.router.navigate(['/']);
    } finally {
      this.loadingSub.next(false);
    }
  }

  async loginWithGoogle(): Promise<void> {
    this.loadingSub.next(true);
    try {
      const cred = await signInWithPopup(this.auth, new GoogleAuthProvider());
      await this._upsertSocialUser(cred);
      this.setLoginTimestamp();
      await this.router.navigate(['/']);
    } finally {
      this.loadingSub.next(false);
    }
  }

  private async _upsertSocialUser(cred: UserCredential) {
    const info = getAdditionalUserInfo(cred);
    let firstName = '';
    let lastName = '';

    if (info?.profile) {
      const p = info.profile as Record<string, any>;
      firstName = p['given_name'] || '';
      lastName = p['family_name'] || '';
      if (!firstName && p['name']) {
        const parts = (p['name'] as string).split(' ');
        firstName = parts.shift()!;
        lastName = parts.join(' ');
      }
    }

    const uid = cred.user.uid;
    const userDoc = doc(this.firestore, 'users', uid);
    await setDoc(
      userDoc,
      {
        email: cred.user.email,
        firstName,
        lastName,
        createdAt: new Date(),
      },
      { merge: true }
    );
  }

  async logout(): Promise<void> {
    this.loadingSub.next(true);
    try {
      await signOut(this.auth);
      localStorage.removeItem('loginTime');
      await this.router.navigate(['/login']);
    } finally {
      this.loadingSub.next(false);
    }
  }

  async deleteAccount(): Promise<void> {
    this.loadingSub.next(true);
    try {
      const user = this.auth.currentUser;
      if (!user) return;

      await deleteDoc(doc(this.firestore, 'users', user.uid));
      await user.delete();
      await signOut(this.auth);
      await this.router.navigate(['/register'], { replaceUrl: true });
    } finally {
      this.loadingSub.next(false);
    }
  }

  async updateProfile(
    updates: Partial<Omit<UserProfile, 'uid' | 'email'>>
  ): Promise<void> {
    this.loadingSub.next(true);
    try {
      const user = this.auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      await updateDoc(doc(this.firestore, 'users', user.uid), updates);
    } finally {
      this.loadingSub.next(false);
    }
  }

  get usersMap$(): Observable<Record<string, UserProfile>> {
    const usersCol = collection(
      this.firestore,
      'users'
    ) as CollectionReference<UserProfile>;

    return collectionData(usersCol, { idField: 'uid' }).pipe(
      map((list: UserProfile[]) =>
        list.reduce((acc, u) => {
          acc[u.uid] = u;
          return acc;
        }, {} as Record<string, UserProfile>)
      )
    );
  }

  private setLoginTimestamp() {
    localStorage.setItem('loginTime', Date.now().toString());
  }

  private startAutoLogoutTimer() {
    const maxSessionMs = 60 * 60 * 1000;
    const checkEveryMs = 60 * 5000;

    setInterval(() => {
      const stored = localStorage.getItem('loginTime');
      if (!stored) return;

      const loginTime = parseInt(stored, 10);
      if (Date.now() - loginTime > maxSessionMs) {
        this.logout();
      }
    }, checkEveryMs);
  }
}
