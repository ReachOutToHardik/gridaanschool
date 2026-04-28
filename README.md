# Gridaan School
Gridaan School is a lightweight faculty portal for creating and managing classes, registering students, and assigning tasks. It uses Firebase Authentication and Firestore for storage and access control.

Key capabilities
- Create and manage class workspaces
- Add/update student records (per-class rosters)
- Create, assign, and track assignments per student
- Google and email/password sign-in with a small allowlist for approved accounts

Quick start (local)
1. Install dependencies:

```bash
npm install
```

2. Configure Firebase: the app reads project credentials from `firebase-applet-config.json`. Update the allowlist in `src/lib/firebase.ts` and the server rules in `firestore.rules` if you need to change permitted accounts.

3. Run the dev server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

Auth & security notes
- Firebase credentials are stored in `firebase-applet-config.json` and loaded by `src/lib/firebase.ts`.
- Access is restricted by an approved-email check in both the client (`src/lib/firebase.ts`) and Firestore security rules (`firestore.rules`). Keep both lists in sync.

Deployment (short)
- Static hosting: the build output is `dist/`. On Render set the build command to `npm run build` and the publish directory to `dist`.
- If using Google sign-in, add your site domain to the Authorized domains list in the Firebase Console.

Notes for interview submission
- This repo is intended to be self-contained. Remove sensitive keys before sharing publicly (the current credentials are in `firebase-applet-config.json`).

License
MIT
