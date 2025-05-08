import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { FirebaseError } from 'firebase/app';

function passwordPatternValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;
    const hasLetter = /[a-zA-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[^a-zA-Z-0-9]/.test(value);
    return hasLetter && hasNumber && hasSpecial
      ? null
      : { passwordPattern: true };
  };
}

function confirmPasswordValidator(
  group: AbstractControl
): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  submitError: string | null = null;

  hidePassword = true;
  loading$ = this.auth.loading$;

  form = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      birthDate: ['', [Validators.required]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          passwordPatternValidator(),
        ],
      ],
      confirmPassword: [''],
    },
    { validators: confirmPasswordValidator }
  );

  get f() {
    return this.form.controls;
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.submitError = 'Please fix the errors in the form.';
      return;
    }
    this.submitError = null;

    const { firstName, lastName, email, birthDate, password } = this.form
      .value as any;

    try {
      await this.auth.register(
        email,
        password,
        firstName,
        lastName,
        new Date(birthDate)
      );
    } catch (err: unknown) {
      console.error('Registration error →', err);
      this.submitError = this.mapFirebaseError(err);
    }
  }

  private mapFirebaseError(err: unknown): string {
    if (err instanceof FirebaseError) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          return 'That email is already registered. Try logging in instead.';
        case 'auth/invalid-email':
          return 'The email address is malformed.';
        case 'auth/weak-password':
          return 'Password is too weak. Please choose at least 6 characters.';
        case 'auth/password-does-not-meet-requirements':
          const match = err.message.match(/\[(.+)\]/);
          const requirement = match
            ? match[1]
            : 'Password does not meet requirements';
          return requirement;
        default:
          return err.message;
      }
    }
    return 'An unexpected error occurred. Please try again.';
  }

  private mapError(err: unknown): string {
    if (err instanceof FirebaseError) {
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          return 'Email or password is incorrect';
        case 'auth/invalid-email':
          return 'Email address is invalid';
        case 'auth/user-disabled':
          return 'This account has been disabled';
        case 'auth/invalid-credential':
          return 'Invalid credentials provided';
        default:
          return err.message;
      }
    }
    return 'An unexpected error occured';
  }

  async loginWithGoogle() {
    this.submitError = null;
    try {
      await this.auth.loginWithGoogle();
    } catch (err: unknown) {
      console.error('Google login error →', err);
      this.submitError = this.mapFirebaseError(err);
    }
  }
}
