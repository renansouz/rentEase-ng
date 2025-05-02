import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { FirebaseError } from 'firebase/app';

import {
  sendPasswordResetEmail,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from '@angular/fire/auth';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authServ = inject(AuthService);
  private auth = inject(Auth);

  resetSent = false;
  hidePassword = true;
  loading$ = this.authServ.loading$;

  errorMessage: string | null = null;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  get f() {
    return this.form.controls;
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

  async onSubmit() {
    if (this.form.invalid) return;
    this.errorMessage = null;

    const email = this.form.value.email!;
    const password = this.form.value.password!;

    try {
      await this.authServ.login(email, password);
    } catch (err) {
      this.errorMessage = this.mapError(err);
    }
  }

  async sendPasswordReset() {
    const email = this.form.value.email?.trim();
    if (!email || this.form.controls.email.invalid) {
      this.form.controls.email.markAsTouched();
      return;
    }

    try {
      await sendPasswordResetEmail(this.auth, email);
      this.resetSent = true;
    } catch (err) {
      console.error('Password reset error:', err);
      this.errorMessage =
        'Failed to send password reset email. Please try again later.';
    }
  }

  async loginWithGoogle() {
    try {
      await this.authServ.loginWithGoogle();
    } catch (err) {
      this.errorMessage = this.mapError(err);
    }
  }
}
