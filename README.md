# Gridaan School

Gridaan School is a Firebase-backed classroom management app for teachers. It provides sign-in, class management, student records, and assignment tracking in a single dashboard.

## Features

- Google sign-in through Firebase Auth
- Email and password sign-in through Firebase Auth
- Firestore-backed classes, students, and assignments
- Whitelist-based access control for approved accounts only

## Getting Started

### Prerequisites

- Node.js 18 or newer
- A Firebase project with Authentication and Firestore enabled

### Install

```bash
npm install
```

### Configure Firebase

The app uses the Firebase project configured in [firebase-applet-config.json](firebase-applet-config.json). Update the allowlist in [src/lib/firebase.ts](src/lib/firebase.ts) and the matching security rules in [firestore.rules](firestore.rules) if you want to add or remove approved accounts.

### Run locally

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

## Deployment Notes

- Deploy the Firestore rules before releasing the app.
- Enable the Google sign-in provider and email/password provider in Firebase Authentication.
- Keep the approved email list aligned between the client and Firestore rules.
