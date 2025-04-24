import { Routes } from '@angular/router';

// import { AuthGuard } from './guards/auth.guard';
// import { AdminGuard } from './guards/admin.guard';

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
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  {
    path: '',
    component: HomeComponent,
    // canActivate: [AuthGuard]
  },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  {
    path: 'flats/new',
    component: NewFlatComponent,
    // canActivate: [AuthGuard]
  },
  {
    path: 'flats/:id',
    component: FlatViewComponent,
    // canActivate: [AuthGuard]
  },
  {
    path: 'flats/:id/edit',
    component: EditFlatComponent,

    // canActivate: [AuthGuard],
  },
  {
    path: 'my-flats',
    component: MyFlatsComponent,
    // canActivate: [AuthGuard]
  },
  {
    path: 'favorites',
    component: FavoritesComponent,

    // canActivate: [AuthGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    // canActivate: [AuthGuard]
  },
  {
    path: 'profile/edit',
    component: ProfileEditComponent,

    // canActivate: [AuthGuard],
  },

  {
    path: 'users',
    component: AllUsersComponent,
    // canActivate: [AuthGuard, AdminGuard],
  },

  { path: '**', component: PageNotFoundComponent },
];
