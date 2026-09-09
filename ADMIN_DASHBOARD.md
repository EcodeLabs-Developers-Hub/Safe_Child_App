# Safe Child Admin Dashboard

The admin website is isolated under `admin/` so the Expo mobile entrypoint, native modules, and React Navigation tree remain unchanged. It uses the same Firebase project and the existing Firestore document IDs.

## Existing data used

The dashboard reads `users`, `students`, `pickup_requests`, `alerts`, `attendance`, `authorized_contacts`, `pickup_audits`, and `ip_blocks`. It reads `reports` when that collection exists; the current mobile code does not create reports. No new Firestore collections or fields are required by the dashboard.

User profile fields are the existing `uid`, `email`, `displayName`, `role`, `status`, `phone`, `photoURL`, `createdAt`, and `updatedAt`. Student and pickup columns reflect the fields currently written by the mobile screens. Existing `photoUri` values are shown as data only when present; they are not treated as Storage URLs. The mobile app currently stores local device URIs and does not use Firebase Storage, so no existing images can be reliably listed until mobile upload code migrates those values to Storage references.

## Configuration

From `admin/`, copy `.env.example` to `.env.local` and fill `VITE_FIREBASE_API_KEY` and `VITE_FIREBASE_APP_ID` using the existing Firebase web app configuration. The remaining values are already the current project identifiers. Firebase client config is browser-visible by design; Firestore and Storage rules provide authorization.

## Local commands

```powershell
cd c:\xampp2\htdocs\Safe_Child_App\admin
npm install
npm run dev
npm run build
npm run preview
```

Routes are `/admin`, `/admin/users`, `/admin/children`, `/admin/pickups`, `/admin/reports`, and `/admin/files`. The login guard checks Firebase Auth and then requires `users/{uid}.role == "admin"`.

## First administrator

1. Create the first account through the existing mobile registration flow or Firebase Authentication.
2. In Firebase Console, open Firestore and set that account's `users/{uid}` document field `role` to `admin`.
3. Sign in at `/admin/login` (the app redirects there through the guarded shell).
4. Promote subsequent users from the Users page. An admin cannot change their own role through the client.

Do not put passwords or service-account credentials in this repository. If the first admin must be promoted through automation, use a trusted server or Firebase Admin SDK, never browser code.

## Firebase rules deployment

Review and deploy `firestore.rules` and `storage.rules` from the Firebase CLI project configuration. The rules require admin reads/writes to resolve the caller's Firestore profile. Storage is admin-only because the current mobile rules did not define a safe Storage ownership model; add narrowly-scoped staff/owner paths when mobile uploads are migrated.

## Vercel deployment

1. Import the repository into Vercel.
2. Set **Root Directory** to `admin`.
3. Set **Build Command** to `npm run build` and **Output Directory** to `dist`.
4. Add all `VITE_FIREBASE_*` values from `.env.local` in Vercel Project Settings for Preview and Production.
5. Deploy. `admin/vercel.json` rewrites client-side routes to `index.html`.
6. Configure the Firebase Authentication authorized domain with the Vercel domain, then optionally attach `admin.yourdomain.com` in Vercel Domains.

## Limitations and verification

The dashboard requires a configured Firebase web app, an existing admin profile, deployed rules, and network access. Firestore queries order by `createdAt`; legacy documents without that field can be rejected by Firestore and will show an actionable error rather than fake data. Run `npm run build` in `admin/` and `npx expo export --platform web` at the repository root to verify both deliverables.