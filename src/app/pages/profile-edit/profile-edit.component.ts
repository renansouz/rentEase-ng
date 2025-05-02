import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { sendPasswordResetEmail } from '@angular/fire/auth';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import {
  Auth,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from '@angular/fire/auth';

import { Timestamp } from 'firebase/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';

function strongPassword(control: AbstractControl) {
  const val = control.value as string;
  if (!/[A-Z]/.test(val) || !/[0-9]/.test(val) || !/[^A-Za-z0-9]/.test(val)) {
    return { weakPassword: true };
  }
  return null;
}

function validBirthDate(c: AbstractControl) {
  const d = new Date(c.value);
  if (isNaN(d.valueOf())) return { invalidDate: true };
  const age = (Date.now() - d.valueOf()) / (1000 * 60 * 60 * 24 * 365);
  if (age < 18) return { tooYoung: true };
  if (age > 120) return { tooOld: true };
  return null;
}

@Component({
  selector: 'app-profile-edit',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.css',
})
export class ProfileEditComponent {
  private authRaw = inject(Auth);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  resetSent = false;
  userSignal = toSignal(this.auth.currentUser$, { initialValue: null });
  loading$ = this.auth.loading$;

  form = this.fb.group(
    {
      email: [{ value: '', disabled: true }],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      birthDate: ['', [Validators.required, validBirthDate]],

      currentPassword: [''],
      newPassword: [''],
      confirmPassword: [''],
    },
    { validators: this.passwordsMatch.bind(this) }
  );

  constructor() {
    this.auth.currentUser$.subscribe((profile) => {
      if (!profile) return;
      const raw = profile.birthDate;
      const date =
        raw instanceof Timestamp
          ? raw.toDate()
          : raw instanceof Date
          ? raw
          : new Date(raw);
      const iso = isNaN(date.getTime())
        ? ''
        : date.toISOString().substring(0, 10);

      this.form.patchValue({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        birthDate: iso,
      });
    });
  }

  get f() {
    return this.form.controls;
  }

  private passwordsMatch(group: FormGroup) {
    const np = group.get('newPassword')!.value;
    const cp = group.get('confirmPassword')!.value;
    return np === cp ? null : { mismatch: true };
  }

  async save() {
    if (this.form.invalid) return;

    await this.auth.updateProfile({
      firstName: this.f['firstName'].value!,
      lastName: this.f['lastName'].value!,
      birthDate: new Date(this.f['birthDate'].value!),
    });

    if (this.showPasswordFields) {
      const user = this.authRaw.currentUser;
      if (user) {
        const cred = EmailAuthProvider.credential(
          user.email!,
          this.f['currentPassword'].value!
        );
        try {
          await reauthenticateWithCredential(user, cred);
          await updatePassword(user, this.f['newPassword'].value!);
        } catch (err: any) {
          if (err.code === 'auth/invalid-credential') {
            this.form
              .get('currentPassword')!
              .setErrors({ invalidPassword: true });
            return;
          }
          throw err;
        }
      }
    }

    this.router.navigate(['/profile']);
  }

  cancel() {
    this.router.navigate(['/profile']);
  }

  showPasswordFields = false;

  togglePasswordFields() {
    this.showPasswordFields = !this.showPasswordFields;

    const cur = this.form.get('currentPassword')!;
    const np = this.form.get('newPassword')!;
    const cp = this.form.get('confirmPassword')!;

    if (this.showPasswordFields) {
      cur.setValidators([Validators.required]);
      np.setValidators([
        Validators.required,
        Validators.minLength(6),
        strongPassword,
      ]);
      cp.setValidators([Validators.required]);
    } else {
      cur.clearValidators();
      cur.reset();
      np.clearValidators();
      np.reset();
      cp.clearValidators();
      cp.reset();
    }
    cur.updateValueAndValidity();
    np.updateValueAndValidity();
    cp.updateValueAndValidity();
    this.form.updateValueAndValidity();
  }

  async sendPasswordReset() {
    const user = this.authRaw.currentUser;
    if (!user?.email) return;

    try {
      await sendPasswordResetEmail(this.authRaw, user.email);
      this.resetSent = true;
    } catch (error) {
      console.error('Password reset error:', error);
    }
  }
}
