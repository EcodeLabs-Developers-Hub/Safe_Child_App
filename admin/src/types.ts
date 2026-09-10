import type { Timestamp } from 'firebase/firestore';

export type Role = 'admin' | 'teacher' | 'parent' | 'security' | 'pickup_verifier';
export type RecordData = Record<string, unknown> & { id: string };
export type UserProfile = RecordData & { uid: string; email?: string; displayName?: string; role?: Role; status?: string; photoURL?: string | null; createdAt?: string | Timestamp };
export type Student = RecordData & { firstName?: string; lastName?: string; grade?: string; guardianName?: string; guardianEmail?: string; status?: string; photoUri?: string | null };
export type AdminPage = 'dashboard' | 'users' | 'children' | 'classes' | 'pickups' | 'attendance' | 'announcements' | 'reports' | 'files';