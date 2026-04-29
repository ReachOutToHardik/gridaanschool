# Gridaan School — School Management Mini System

A lightweight school management web application for managing classes, students, and assignments. Built as a technical assessment for Gridaan.

---

## Login Credentials

### Demo Account (Email/Password)
- **Email:** `sample.teacher@gridaan.school`
- **Password:** `Gridaan@2026!`

### Google Sign-In
- **Allowed:** `joshi14hardik@gmail.com`

> You can also click the **"Use demo credentials"** button on the login page to auto-fill the demo account.

---

## Features Implemented

### Authentication
- Admin login with email/password
- Google Sign-In (restricted to approved accounts)
- Email allowlist for access control
- Firestore security rules with field-level validation

### Student Management
- Add new students to a class
- Edit student details (name, email)
- Delete students from a class
- View list of students with search/filter
- Real-time updates via Firestore listeners

### Task / Assignment Management
- Assign tasks/homework to individual students
- Bulk-assign tasks to all students in a class
- Mark tasks as completed / revert to pending
- View all assigned tasks with student filter
- Due date tracking

### Dashboard
- Class-based workspace system
- Tabbed navigation (Students / Tasks) per class
- Create and delete class workspaces
- Demo data seeding for quick exploration

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Database | Firebase Firestore |
| Authentication | Firebase Auth (Email/Password + Google) |
| Build Tool | Vite |

---

## Quick Start (Local)

1. **Clone the repository:**
```bash
git clone https://github.com/ReachOutToHardik/gridaanschool.git
cd gridaanschool
```

2. **Install dependencies:**
```bash
npm install
```

3. **Run the dev server:**
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

4. **Build for production:**
```bash
npm run build
```

---

## Project Structure

```
src/
├── App.tsx                    # Main app with auth flow and routing
├── main.tsx                   # Entry point
├── index.css                  # Global styles and component classes
├── types.ts                   # TypeScript interfaces
├── lib/
│   ├── firebase.ts            # Firebase config, auth helpers, allowlist
│   └── utils.ts               # Error handling and utilities
└── components/
    ├── ClassOverview.tsx       # Class list / dashboard view
    ├── ClassDetail.tsx         # Individual class with tabbed navigation
    ├── StudentManagement.tsx   # Student CRUD operations
    └── AssignmentManagement.tsx # Assignment CRUD with bulk assign
```

---

## License

MIT
