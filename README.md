# RentEase🏡

**RentEase** is an Angular + Firebase academic project for matching landlords with renters.

🔗 **Live Demo**  
https://rentease-greystone.web.app/

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/renansouz/rentEase-ng.git
cd rentEase-ng
```

### Firebase configuration

1. In the ```src/app/``` folder, create a new file named ```app.config.ts```

2. Copy our Firebase SDK config object (the one shared in Teams) into it.

```bash
3. // src/app.config.ts
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

### Project Structure
```bash
src/
├── app/
│   ├── pages/            # Angular pages (Home, Flats, Users, etc.)
│   ├── components/       # Reusable components (Header, etc.)
│   └── services/         # Firebase services (Auth, Flat, Message, Favorites)
├── app.config.ts         # Our Firebase SDK config (create this file)
└── styles.css            # Global styles (Tailwind)
public/                   # Static files copied to `dist` at build time
```

Feel free to explore, extend, and learn! 🚀
