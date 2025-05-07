import {
  Component,
  inject,
  Signal,
  computed,
  WritableSignal,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Firestore,
  collection,
  collectionData,
  CollectionReference,
  doc,
  updateDoc,
  query,
  writeBatch,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIcon } from '@angular/material/icon';

import { Router } from '@angular/router';
import { AuthService, UserProfile } from '../../../services/auth.service';
import { FlatService, Flat } from '../../../services/flat.service';

const INCREMENT = 10;

@Component({
  selector: 'app-all-users',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatSnackBarModule,
    MatIcon,
  ],
  templateUrl: './all-users.component.html',
  styleUrl: './all-users.component.css',
})
export class AllUsersComponent {
  private db = inject(Firestore);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private flatService = inject(FlatService);
  private auth = inject(AuthService);
  pageSize: WritableSignal<number> = signal(INCREMENT);

  currentUser = toSignal(this.auth.currentUser$, { initialValue: null });

  private usersRef = collection(
    this.db,
    'users'
  ) as CollectionReference<UserProfile>;

  private allUsers$ = collectionData<UserProfile>(this.usersRef, {
    idField: 'uid',
  });

  usersSignal: Signal<UserProfile[]> = toSignal(this.allUsers$, {
    initialValue: [],
  });

  private allFlatsSignal: Signal<(Flat & { id: string })[]> = toSignal(
    this.flatService.getAllFlats(),
    { initialValue: [] }
  );

  filterForm: FormGroup = this.fb.group({
    userType: ['all'],
    minAge: [0],
    maxAge: [150],
    minFlats: [0],
    maxFlats: [100],
    onlyAdmins: [null],
    sortBy: ['firstName'],
  });
  private filtersSignal = toSignal(this.filterForm.valueChanges, {
    initialValue: this.filterForm.value,
  });

  displayedUsers: Signal<
    Array<UserProfile & { age: number; flatsCount: number }>
  > = computed(() => {
    const users = this.usersSignal();
    const flats = this.allFlatsSignal();
    const f = this.filtersSignal();

    const ageOf = (bd: any) => {
      const d = bd?.toDate?.() ?? new Date(bd);
      return Math.floor(
        (Date.now() - d.valueOf()) / (1000 * 60 * 60 * 24 * 365)
      );
    };

    const enriched = users.map((u) => ({
      ...u,
      age: ageOf(u.birthDate),
      flatsCount: flats.filter((x) => x.ownerUID === u.uid).length,
    }));

    const filtered = enriched.filter((u) => {
      if (f.userType === 'admin' && !u.isAdmin) return false;
      if (f.userType === 'user' && u.isAdmin) return false;
      if (u.age < f.minAge || u.age > f.maxAge) return false;
      if (u.flatsCount < f.minFlats || u.flatsCount > f.maxFlats) return false;
      if (f.onlyAdmins !== null && u.isAdmin !== f.onlyAdmins) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      const key = f.sortBy as keyof typeof a;
      return a[key]! > b[key]! ? -1 : a[key]! < b[key]! ? 1 : 0;
    });
  });

  async grantAdmin(user: UserProfile) {
    await updateDoc(doc(this.db, 'users', user.uid), { isAdmin: true });
    this.snackBar.open(
      `${user.firstName} ${user.lastName} is now an admin.`,
      'Close',
      { duration: 3000 }
    );
  }

  async removeUser(user: UserProfile) {
    const batch = writeBatch(this.db);

    const flatsCol = collection(this.db, 'flats');
    const q = query(flatsCol, where('ownerUID', '==', user.uid));
    const snapshot = await getDocs(q);

    snapshot.forEach((flatDoc) => {
      batch.delete(flatDoc.ref);
    });

    batch.delete(doc(this.db, 'users', user.uid));

    await batch.commit();

    this.snackBar.open(
      `Deleted ${user.firstName} ${user.lastName} and their ${snapshot.size} flats.`,
      'Close',
      { duration: 3000 }
    );
  }

  viewUserProfile(uid: string) {
    this.router.navigate(['/users', uid]);
  }

  filteredUsers = this.displayedUsers;

  limitedUsers = computed(() => this.filteredUsers().slice(0, this.pageSize()));

  nextLimit = computed(() =>
    Math.min(this.pageSize() + INCREMENT, this.filteredUsers().length)
  );

  get canLoadMore() {
    return this.filteredUsers().length > this.pageSize();
  }

  loadMore() {
    this.pageSize.update((n) => n + INCREMENT);
  }

  getDisplayedColumns() {
    return [
      'firstName',
      'lastName',
      'age',
      'flatsCount',
      'isAdmin',
      'profile',
      'actions',
    ];
  }

  async onCleanDatabase() {
    if (!confirm('Really delete orphan flats, users & empty chats?')) return;

    const batch = writeBatch(this.db);

    const [usersSnap, flatsSnap, chatsSnap] = await Promise.all([
      getDocs(collection(this.db, 'users')),
      getDocs(collection(this.db, 'flats')),
      getDocs(collection(this.db, 'chats')),
    ]);

    const allUserIds = new Set(usersSnap.docs.map((d) => d.id));
    const allFlatIds = new Set(flatsSnap.docs.map((d) => d.id));

    const ownerCounts = new Map<string, number>();
    flatsSnap.docs.forEach((f) => {
      const owner = f.data()['ownerUID'] as string;
      ownerCounts.set(owner, (ownerCounts.get(owner) || 0) + 1);
    });

    let flatsDeleted = 0;
    let usersDeleted = 0;
    let chatsDeleted = 0;

    flatsSnap.docs.forEach((f) => {
      const owner = f.data()['ownerUID'] as string;
      if (!allUserIds.has(owner)) {
        batch.delete(f.ref);
        flatsDeleted++;
      }
    });

    usersSnap.docs.forEach((u) => {
      if ((ownerCounts.get(u.id) || 0) === 0) {
        batch.delete(u.ref);
        usersDeleted++;
      }
    });

    for (const c of chatsSnap.docs) {
      const chatData = c.data() as { flatId: string };
      if (!allFlatIds.has(chatData.flatId)) {
        batch.delete(c.ref);
        chatsDeleted++;
        continue;
      }
      const msgsSnap = await getDocs(
        collection(this.db, `chats/${c.id}/messages`)
      );
      if (msgsSnap.empty) {
        batch.delete(c.ref);
        chatsDeleted++;
      }
    }

    await batch.commit();

    this.snackBar.open(
      `Removed ${flatsDeleted} flats, ${usersDeleted} users, ${chatsDeleted} chats.`,
      'OK',
      { duration: 5000 }
    );
  }
}
