import * as FirebaseFirestore from '@google-cloud/firestore';
import { DeltaDocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
export declare const initialize: (adminOptions: any) => void;
export declare class Snapshot<T extends Timestamps> {
    ref: FirebaseFirestore.DocumentReference;
    data: T;
    constructor(ref: FirebaseFirestore.DocumentReference, data: T);
    constructor(snapshot: FirebaseFirestore.DocumentSnapshot | DeltaDocumentSnapshot);
    static makeNotSavedSnapshot<T extends Timestamps>(path: string, data: T): Snapshot<T>;
    setCreatedDate(): void;
    save(): Promise<FirebaseFirestore.WriteResult>;
    saveWithBatch(batch: FirebaseFirestore.WriteBatch): FirebaseFirestore.WriteBatch;
    setReferenceCollectionWithBatch(collection: string, ref: FirebaseFirestore.DocumentReference, batch: FirebaseFirestore.WriteBatch): FirebaseFirestore.WriteBatch;
    update(data: {
        [id: string]: any;
    }): Promise<FirebaseFirestore.WriteResult>;
}
export interface Timestamps {
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const fetch: <T extends Timestamps>(path: string, id: string) => Promise<Snapshot<T>>;
