# RentEase 🏘️

**RentEase** is a single-page Progressive Web App (PWA) built with Angular and Firebase that streamlines the process of finding and listing rental properties. Landlords can publish and manage flats; renters can search, favorite, and chat in real time, all in a responsive, mobile-first interface powered by Tailwind CSS.

🔗 **Live Demo**  
https://rentease-greystone.web.app/

---

## 🚀 Key Features

- **Authentication & Authorization**  
  - Email/password & Google OAuth (Firebase Auth)  
  - Role-based guards (`authGuard`, `adminGuard`, `guestGuard`)  
  - User profile CRUD, password / session management  

- **Property Management**  
  - Create, read, update, delete (CRUD) flats (Firestore)  
  - Server-timestamped metadata (`createdAt`, `availableDate`)  
  - Image upload & display (optional `photoUrl`)  

- **Advanced Search & Filters**  
  - Full-screen search with multi-criteria filters (city, price, area)  
  - Dropdowns & dynamic sorting  

- **Favorites & My Listings**  
  - Add/remove favorites (persisted per–user)  
  - “My Flats” dashboard with inline edit/delete  

- **Real-Time Chat**  
  - One-to-one chat per flat (Firestore subcollections)  
  - Unread‐message tracking (`lastReadAt`, `lastMessageAt`)  
  - Notifications badge in `<app-header>`  
  - Auto-scroll to newest message, “Enter to send”  

- **Admin Console**  
  - Full user management table with filters, sorting, pagination  
  - Grant or revoke admin privileges with one click  
  - Delete user accounts directly from the UI  
  - Instant feedback via Angular Material SnackBar
 
  - **Error Handling**  
  All writes (`updateDoc`, `deleteDoc`) are wrapped in `try/catch` (or `catchError`) to prevent unhandled exceptions when participant docs are missing.
 

- **UX Enhancements**  
  - Angular Signals & RxJS interop (`toSignal`) for reactive state  
  - Tailwind CSS utility-first styling  
  - Angular Material components: snackbars, dialogs, forms, icons, tables  
  - MatProgressSpinner for loading states  
  - Responsive design (mobile ↔ desktop)  

---

## 📦 Tech Stack

| Layer            | Technology                                           |
| ---------------- | ---------------------------------------------------- |
| **Framework**    | Angular 19     |
| **Styling**      | Tailwind CSS, Angular Material                       |
| **Data & Auth**  | Firebase Auth, Firestore (NoSQL), Firebase Hosting   |
| **Reactive**     | RxJS, `@angular/core/rxjs-interop` (`toSignal`)      |
| **Routing**      | Angular Router (lazy children, parameterized routes) |
| **CI/CD**        | GitHub Actions → Firebase CLI deploy                 |

---

## 🏗️ Architecture & Code Structure

``` bash
src/
├── app/
│ ├── components/ # Shared UI 
│ ├── guards/ # Route guards 
│ ├── pages/ # All pages
│ ├── services/ # AuthService, FlatService, ChatService
│ ├── app.routes.ts # Route definitions + guards
│ └── app.config.ts # Root imports & providers
├── styles.css # Tailwind base + global theming
```

---

## 🔧 Getting Started 

### 1. Clone the repo

```bash
git clone https://github.com/renansouz/rentEase-ng.git
cd rentEase-ng
```


### Firebase configuration

1. In the ```src/app/``` folder, create a new file named ```app.config.ts```


2. Copy our Firebase SDK config object into it.

```bash
//  src/app.config.ts
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### 3. Install dependencies
```bash
npm install
```
### 4. Run locally

```bash
ng serve -o
```

## 🎯 Development Patterns

- Standalone Components with imports: [...] rather than NgModule declarations
- Reactive Forms (FormBuilder, Validators) for all inputs
- Firestore Queries optimized with where, orderBy & Indexed composite queries
- Angular Material for accessible, consistent UI elements
- Tailwind CSS for rapid utility-first styling and responsive breakpoints

## 🤝 Contributing

- Fork the repo
- Create a feature branch
- Open a Pull Request with a clear description of your changes
- Adhere to Angular Style Guide & commit message conventions


---
Thank you for exploring RentEase! Built to demonstrate end-to-end full-stack prowess with Angular, RxJS, Firebase, and modern web best practices. Questions or improvements? Open an issue or PR—happy renting! 🚀
