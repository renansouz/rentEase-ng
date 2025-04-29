import { Component, inject, Signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Firestore,
  collection,
  collectionData,
  CollectionReference,
  doc,
  deleteDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

import { Router } from '@angular/router';
import { AuthService, UserProfile } from '../../../services/auth.service';
import { FlatService, Flat } from '../../../services/flat.service';

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
  ],
  templateUrl: './all-users.component.html',
  styleUrl: './all-users.component.css',
})
export class AllUsersComponent {
  private db = inject(Firestore);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private flatService = inject(FlatService);
  private auth = inject(AuthService);

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
    minAge: [18],
    maxAge: [120],
    minFlats: [0],
    maxFlats: [50],
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
      return a[key]! < b[key]! ? -1 : a[key]! > b[key]! ? 1 : 0;
    });
  });

  async grantAdmin(user: UserProfile) {
    await updateDoc(doc(this.db, 'users', user.uid), { isAdmin: true });
  }

  async removeUser(user: UserProfile) {
    await deleteDoc(doc(this.db, 'users', user.uid));
  }

  viewUserProfile(uid: string) {
    this.router.navigate(['/users', uid]);
  }
}
