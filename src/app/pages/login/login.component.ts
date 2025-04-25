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
  private auth = inject(AuthService);

  hidePassword = true;
  loading$ = this.auth.loading$;

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
      await this.auth.login(email, password);
    } catch (err) {
      this.errorMessage = this.mapError(err);
    }
  }
}
