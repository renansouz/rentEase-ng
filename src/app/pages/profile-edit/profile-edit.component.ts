import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService, UserProfile } from '../../services/auth.service';

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
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  userSignal = toSignal(this.auth.currentUser$, { initialValue: null });
  loading$ = this.auth.loading$;

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    birthDate: ['', Validators.required],
  });

  constructor() {
    this.userSignal();
    this.auth.currentUser$.subscribe((profile) => {
      if (profile) {
        this.form.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          birthDate: profile.birthDate.toISOString().substring(0, 10), // yyyy-MM-dd
        });
      }
    });
  }

  get f() {
    return this.form.controls;
  }

  async save() {
    if (this.form.invalid) return;
    await this.auth.updateProfile({
      firstName: this.form.value.firstName!,
      lastName: this.form.value.lastName!,
      birthDate: new Date(this.form.value.birthDate!),
    });
    this.router.navigate(['/profile']);
  }

  cancel() {
    this.router.navigate(['/profile']);
  }
}
