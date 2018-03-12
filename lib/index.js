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
exports.initialize = (adminOptions) => {
    firestore = new FirebaseFirestore.Firestore(adminOptions);
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
    static makeNotSavedSnapshot(path, data) {
        const ref = firestore.collection(path).doc();
        return new Snapshot(ref, data);
    }
    setCreatedDate() {
        this.data.createdAt = new Date();
        this.data.updatedAt = new Date();
    }
    save() {
        this.setCreatedDate();
        return this.ref.create(this.data);
    }
    saveWithBatch(batch) {
        this.setCreatedDate();
        batch.create(this.ref, this.data);
    }
    saveReferenceCollectionWithBatch(batch, collection, ref) {
        const rc = this.ref.collection(collection).doc(ref.id);
        batch.create(rc, { createdAt: new Date(), updatedAt: new Date() });
    }
    update(data) {
        data.updatedAt = new Date();
        Object.keys(data).forEach(key => {
            this.data[key] = data[key];
        });
        return this.ref.update(data);
    }
    updateWithBatch(batch, data) {
        data.updatedAt = new Date();
        Object.keys(data).forEach(key => {
            this.data[key] = data[key];
        });
        batch.update(this.ref, data);
    }
}
exports.Snapshot = Snapshot;
exports.fetch = (pathOrDocRef) => __awaiter(this, void 0, void 0, function* () {
    let docPath = '';
    if (pathOrDocRef instanceof FirebaseFirestore.DocumentReference) {
        docPath = pathOrDocRef.path;
    }
    else {
        docPath = `${pathOrDocRef.path}/${pathOrDocRef.id}`;
    }
    const ds = yield firestore.doc(docPath).get();
    if (!ds.exists) {
        throw Error(`${ds.ref.path} is not found.`);
    }
    return new Snapshot(ds);
});
