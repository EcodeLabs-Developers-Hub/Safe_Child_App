import { collection, doc, getCountFromServer, getDocs, limit, orderBy, query, startAfter, updateDoc, where, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from './firebase';
import type { RecordData } from './types';

export const readPage = async (name: string, pageSize: number, cursor?: QueryDocumentSnapshot<DocumentData>, search = '') => {
  const constraints = [orderBy('createdAt', 'desc'), ...(cursor ? [startAfter(cursor)] : []), limit(pageSize)];
  const snapshot = await getDocs(query(collection(db, name), ...constraints));
  const records = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as RecordData[];
  const needle = search.trim().toLowerCase();
  return { records: needle ? records.filter((item) => JSON.stringify(item).toLowerCase().includes(needle)) : records, cursor: snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : undefined };
};

export const count = async (name: string, filters: { field: string; value: unknown }[] = []) => {
  const constraints = filters.map(({ field, value }) => where(field, '==', value));
  return (await getCountFromServer(query(collection(db, name), ...constraints))).data().count;
};

export const updateUser = (uid: string, fields: Record<string, unknown>) => updateDoc(doc(db, 'users', uid), fields);
export const updateRecord = (name: string, id: string, fields: Record<string, unknown>) => updateDoc(doc(db, name, id), fields);