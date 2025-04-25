import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { guestGuard } from './guards/guest.guard';

import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomeComponent } from './pages/home/home.component';
import { NewFlatComponent } from './pages/flats/new-flat/new-flat.component';
import { FlatViewComponent } from './pages/flats/flat-view/flat-view.component';
import { EditFlatComponent } from './pages/flats/edit-flat/edit-flat.component';
import { MyFlatsComponent } from './pages/my-flats/my-flats.component';
import { FavoritesComponent } from './pages/favorites/favorites.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ProfileEditComponent } from './pages/profile-edit/profile-edit.component';
import { AllUsersComponent } from './pages/users/all-users/all-users.component';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },

  {
    path: '',
    component: HomeComponent,
    canActivate: [authGuard],
  },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  {
    path: 'flats/new',
    component: NewFlatComponent,
    canActivate: [authGuard],
  },
  {
    path: 'flats/:id',
    component: FlatViewComponent,
    canActivate: [authGuard],
  },
  {
    path: 'flats/:id/edit',
    component: EditFlatComponent,

    canActivate: [authGuard],
  },
  {
    path: 'my-flats',
    component: MyFlatsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'favorites',
    component: FavoritesComponent,

    canActivate: [authGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard],
  },
  {
    path: 'profile/edit',
    component: ProfileEditComponent,

    canActivate: [authGuard],
  },

  {
    path: 'users',
    component: AllUsersComponent,
    canActivate: [authGuard, adminGuard],
  },

  { path: '**', component: PageNotFoundComponent },
];
