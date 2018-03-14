import * as FirebaseFirestore from '@google-cloud/firestore';
import { DeltaDocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
export declare const initialize: (_firestore: FirebaseFirestore.Firestore) => void;
export declare class Snapshot<T extends Timestamps> {
    ref: FirebaseFirestore.DocumentReference;
    data: T;
    constructor(ref: FirebaseFirestore.DocumentReference, data: T);
    constructor(snapshot: FirebaseFirestore.DocumentSnapshot | DeltaDocumentSnapshot);
    static makeNotSavedSnapshot<T extends Timestamps>(path: string, data: T): Snapshot<T>;
    private setCreatedDate();
    save(): Promise<FirebaseFirestore.WriteResult>;
    saveWithBatch(batch: FirebaseFirestore.WriteBatch): void;
    saveReferenceCollectionWithBatch(batch: FirebaseFirestore.WriteBatch, collection: string, ref: FirebaseFirestore.DocumentReference): void;
    update(data: {
        [id: string]: any;
    }): Promise<FirebaseFirestore.WriteResult>;
    updateWithBatch(batch: FirebaseFirestore.WriteBatch, data: {
        [id: string]: any;
    }): void;
}
export interface Timestamps {
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const fetch: <T extends Timestamps>(pathOrDocRef: FirebaseFirestore.DocumentReference | {
    path: string;
    id: string;
}) => Promise<Snapshot<T>>;
