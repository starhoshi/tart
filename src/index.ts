import * as admin from 'firebase-admin'
import { convertToInput, convertToOutput } from './convertor'

type Partial<T> = { [P in keyof T]?: T[P]; }

let firestore: admin.firestore.Firestore

export const initialize = (_firestore: admin.firestore.Firestore) => {
  firestore = _firestore
}

export class Snapshot<T extends Timestamps> {
  ref: admin.firestore.DocumentReference
  data: T

  constructor(ref: admin.firestore.DocumentReference, data: T)
  constructor(snapshot: admin.firestore.DocumentSnapshot)
  constructor(a: any, b?: any) {
    if (b === null || b === undefined) {
      this.ref = a.ref
      this.data = convertToOutput(a.data() as T)
    } else {
      this.ref = a
      this.data = b
    }
  }

  get firestoreURL(): string | undefined {
    const _firestore = this.ref.firestore as any
    if (_firestore && _firestore._referencePath && _firestore._referencePath.projectId) {
      return `https://console.firebase.google.com/project/${_firestore._referencePath.projectId}/database/firestore/data/${this.ref.path}`
    }
    return undefined
  }

  private setCreatedDate() {
    this.data.createdAt = new Date()
    this.data.updatedAt = new Date()
  }

  async refresh() {
    this.data = await fetch<T>(this.ref).then(s => s.data)
  }

  save() {
    this.setCreatedDate()
    return this.ref.create(convertToInput(this.data))
  }

  saveWithBatch(batch: admin.firestore.WriteBatch) {
    this.setCreatedDate()
    batch.create(this.ref, convertToInput(this.data))
  }

  saveReferenceCollection<S extends Timestamps>(collectionName: string, snapshot: Snapshot<S>) {
    const rc = this.ref.collection(collectionName).doc(snapshot.ref.id)
    return rc.create(convertToInput({ createdAt: new Date(), updatedAt: new Date() }))
  }

  saveReferenceCollectionWithBatch<S extends Timestamps>(batch: admin.firestore.WriteBatch, collectionName: string, snapshot: Snapshot<S>) {
    const rc = this.ref.collection(collectionName).doc(snapshot.ref.id)
    batch.create(rc, convertToInput({ createdAt: new Date(), updatedAt: new Date() }))
  }

  saveNestedCollection<S extends Timestamps>(collectionName: string, snapshot: Snapshot<S>) {
    const rc = this.ref.collection(collectionName).doc(snapshot.ref.id)
    return rc.create(convertToInput(snapshot.data))
  }

  saveNestedCollectionWithBatch<S extends Timestamps>(batch: admin.firestore.WriteBatch, collectionName: string, snapshot: Snapshot<S>) {
    const rc = this.ref.collection(collectionName).doc(snapshot.ref.id)
    batch.create(rc, convertToInput(snapshot.data))
  }

  async fetchNestedCollections<S extends Timestamps>(collectionName: string) {
    const nc = await this.ref.collection(collectionName).get()
    const ncs = nc.docs.map(doc => {
      return new Snapshot<S>(doc)
    })
    return ncs
  }

  update(data: Partial<T>) {
    data.updatedAt = new Date()
    Object.keys(data).forEach(key => {
      this.data[key] = data[key]
    })
    return this.ref.update(convertToInput(data))
  }

  updateWithBatch(batch: admin.firestore.WriteBatch, data: Partial<T>) {
    data.updatedAt = new Date()
    Object.keys(data).forEach(key => {
      this.data[key] = data[key]
    })
    batch.update(this.ref, convertToInput(data))
  }

  delete() {
    return this.ref.delete()
  }

  deleteWithBatch(batch: admin.firestore.WriteBatch) {
    batch.delete(this.ref)
  }
}

export interface Timestamps {
  createdAt?: Date
  updatedAt?: Date
}

export const makeNotSavedSnapshot = <T extends Timestamps>(path: string, data: T, id?: string) => {
  let ref = firestore.collection(path).doc()
  if (id) {
    ref = firestore.collection(path).doc(id)
  }
  return new Snapshot<T>(ref, data)
}

export const fetch = async <T extends Timestamps>(pathOrDocumentReference: string | admin.firestore.DocumentReference, id?: string) => {
  let docPath: string = ''
  if (typeof pathOrDocumentReference === 'string') {
    docPath = `${pathOrDocumentReference}/${id}`
  } else {
    docPath = (pathOrDocumentReference as admin.firestore.DocumentReference).path
  }

  const ds = await firestore.doc(docPath).get()
  if (!ds.exists) {
    throw Error(`${ds.ref.path} is not found.`)
  }
  return new Snapshot<T>(ds)
}