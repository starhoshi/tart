import * as admin from 'firebase-admin';
declare type Partial<T> = {
    [P in keyof T]?: T[P];
};
export declare const initialize: (_firestore: FirebaseFirestore.Firestore) => void;
export declare class Snapshot<T extends Timestamps> {
    ref: admin.firestore.DocumentReference;
    data: T;
    constructor(ref: admin.firestore.DocumentReference, data: T);
    constructor(snapshot: admin.firestore.DocumentSnapshot);
    readonly firestoreURL: string | undefined;
    private setCreatedDate;
    refresh(): Promise<void>;
    save(): Promise<FirebaseFirestore.WriteResult>;
    saveWithBatch(batch: admin.firestore.WriteBatch): void;
    saveReferenceCollection<S extends Timestamps>(collectionName: string, snapshot: Snapshot<S>): Promise<FirebaseFirestore.WriteResult>;
    saveReferenceCollectionWithBatch<S extends Timestamps>(batch: admin.firestore.WriteBatch, collectionName: string, snapshot: Snapshot<S>): void;
    saveNestedCollection<S extends Timestamps>(collectionName: string, snapshot: Snapshot<S>): Promise<FirebaseFirestore.WriteResult>;
    saveNestedCollectionWithBatch<S extends Timestamps>(batch: admin.firestore.WriteBatch, collectionName: string, snapshot: Snapshot<S>): void;
    fetchNestedCollections<S extends Timestamps>(collectionName: string): Promise<Snapshot<S>[]>;
    update(data: Partial<T>): Promise<FirebaseFirestore.WriteResult>;
    updateWithBatch(batch: admin.firestore.WriteBatch, data: Partial<T>): void;
    delete(): Promise<FirebaseFirestore.WriteResult>;
    deleteWithBatch(batch: admin.firestore.WriteBatch): void;
}
export interface Timestamps {
    createdAt?: admin.firestore.Timestamp;
    updatedAt?: admin.firestore.Timestamp;
}
export declare const makeNotSavedSnapshot: <T extends Timestamps>(path: string, data: T, id?: string | undefined) => Snapshot<T>;
export declare const fetch: <T extends Timestamps>(pathOrDocumentReference: string | FirebaseFirestore.DocumentReference, id?: string | undefined) => Promise<Snapshot<T>>;
export {};
