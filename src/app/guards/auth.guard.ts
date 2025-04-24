import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { from, map, take, tap } from 'rxjs';
// TODO: Add authentication logic here
export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  return true; // Replace with your actual authentication logic

  // return from(auth.authState).pipe(
  //   take(1),
  //   map((user) => {
  //     if (user) return true;
  //     router.navigate(['/login']);
  //     return false;
  //   })
  // );
};
