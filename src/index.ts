import * as FirebaseFirestore from '@google-cloud/firestore'
import { DeltaDocumentSnapshot } from 'firebase-functions/lib/providers/firestore'

let firestore: FirebaseFirestore.Firestore

export const initialize = (adminOptions: any) => {
  firestore = new FirebaseFirestore.Firestore(adminOptions)
}

export class Snapshot<T extends Timestamps> {
  ref: FirebaseFirestore.DocumentReference
  data: T

  constructor(ref: FirebaseFirestore.DocumentReference, data: T)
  constructor(snapshot: FirebaseFirestore.DocumentSnapshot | DeltaDocumentSnapshot)
  constructor(a: any, b?: any) {
    if (b === null || b === undefined) {
      this.ref = a.ref
      this.data = a.data() as T
    } else {
      this.ref = a
      this.data = b
    }
  }

  static makeNotSavedSnapshot<T extends Timestamps>(path: string, data: T) {
    const ref = firestore.collection(path).doc()
    return new Snapshot<T>(ref, data)
  }

  private setCreatedDate() {
    this.data.createdAt = new Date()
    this.data.updatedAt = new Date()
  }

  save() {
    this.setCreatedDate()
    return this.ref.create(this.data)
  }

  saveWithBatch(batch: FirebaseFirestore.WriteBatch) {
    this.setCreatedDate()
    batch.create(this.ref, this.data)
  }

  saveReferenceCollectionWithBatch(batch: FirebaseFirestore.WriteBatch, collection: string, ref: FirebaseFirestore.DocumentReference) {
    const rc = this.ref.collection(collection).doc(ref.id)
    batch.create(rc, { createdAt: new Date(), updatedAt: new Date() })
  }

  update(data: { [id: string]: any }) {
    data.updatedAt = Date()
    Object.keys(data).forEach(key => {
      this.data[key] = data[key]
    })
    return this.ref.update(data)
  }

  updateWithBatch(batch: FirebaseFirestore.WriteBatch, data: { [id: string]: any }) {
    data.updatedAt = Date()
    Object.keys(data).forEach(key => {
      this.data[key] = data[key]
    })
    batch.update(this.ref, data)
  }
}

export interface Timestamps {
  createdAt?: Date
  updatedAt?: Date
}

export const fetch = async <T extends Timestamps>(pathOrDocRef: { path: string, id: string } | FirebaseFirestore.DocumentReference) => {
  let docPath: string = ''
  if (pathOrDocRef instanceof FirebaseFirestore.DocumentReference) {
    docPath = pathOrDocRef.path
  } else {
    docPath = `${pathOrDocRef.path}/${pathOrDocRef.id}`
  }

  const ds = await firestore.doc(docPath).get()
  if (!ds.exists) {
    throw Error(`${ds.ref.path} is not found.`)
  }
  return new Snapshot<T>(ds)
}
