"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const FirebaseFirestore = require("@google-cloud/firestore");
let firestore;
exports.initialize = (_firestore) => {
    firestore = _firestore;
};
class Snapshot {
    constructor(a, b) {
        if (b === null || b === undefined) {
            this.ref = a.ref;
            this.data = a.data();
        }
        else {
            this.ref = a;
            this.data = b;
        }
    }
    get firestoreURL() {
        const _firestore = this.ref.firestore;
        if (_firestore && _firestore._referencePath && _firestore._referencePath.projectId) {
            return `https://console.firebase.google.com/project/${_firestore._referencePath.projectId}/database/firestore/data/${this.ref.path}`;
        }
        return undefined;
    }
    setCreatedDate() {
        this.data.createdAt = FirebaseFirestore.Timestamp.fromDate(new Date());
        this.data.updatedAt = FirebaseFirestore.Timestamp.fromDate(new Date());
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            this.data = yield exports.fetch(this.ref).then(s => s.data);
        });
    }
    save() {
        this.setCreatedDate();
        return this.ref.create(this.data);
    }
    saveWithBatch(batch) {
        this.setCreatedDate();
        batch.create(this.ref, this.data);
    }
    saveReferenceCollection(collectionName, snapshot) {
        const rc = this.ref.collection(collectionName).doc(snapshot.ref.id);
        return rc.create({ createdAt: new Date(), updatedAt: new Date() });
    }
    saveReferenceCollectionWithBatch(batch, collectionName, snapshot) {
        const rc = this.ref.collection(collectionName).doc(snapshot.ref.id);
        batch.create(rc, { createdAt: new Date(), updatedAt: new Date() });
    }
    saveNestedCollection(collectionName, snapshot) {
        const rc = this.ref.collection(collectionName).doc(snapshot.ref.id);
        return rc.create(snapshot.data);
    }
    saveNestedCollectionWithBatch(batch, collectionName, snapshot) {
        const rc = this.ref.collection(collectionName).doc(snapshot.ref.id);
        batch.create(rc, snapshot.data);
    }
    fetchNestedCollections(collectionName) {
        return __awaiter(this, void 0, void 0, function* () {
            const nc = yield this.ref.collection(collectionName).get();
            const ncs = nc.docs.map(doc => {
                return new Snapshot(doc);
            });
            return ncs;
        });
    }
    update(data) {
        data.updatedAt = FirebaseFirestore.Timestamp.fromDate(new Date());
        Object.keys(data).forEach(key => {
            this.data[key] = data[key];
        });
        return this.ref.update(data);
    }
    updateWithBatch(batch, data) {
        data.updatedAt = FirebaseFirestore.Timestamp.fromDate(new Date());
        Object.keys(data).forEach(key => {
            this.data[key] = data[key];
        });
        batch.update(this.ref, data);
    }
    delete() {
        return this.ref.delete();
    }
    deleteWithBatch(batch) {
        batch.delete(this.ref);
    }
}
exports.Snapshot = Snapshot;
exports.makeNotSavedSnapshot = (path, data, id) => {
    let ref = firestore.collection(path).doc();
    if (id) {
        ref = firestore.collection(path).doc(id);
    }
    return new Snapshot(ref, data);
};
exports.fetch = (pathOrDocumentReference, id) => __awaiter(this, void 0, void 0, function* () {
    let docPath = '';
    if (typeof pathOrDocumentReference === 'string') {
        docPath = `${pathOrDocumentReference}/${id}`;
    }
    else {
        docPath = pathOrDocumentReference.path;
    }
    const ds = yield firestore.doc(docPath).get();
    if (!ds.exists) {
        throw Error(`${ds.ref.path} is not found.`);
    }
    return new Snapshot(ds);
});
