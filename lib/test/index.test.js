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
const admin = require("firebase-admin");
const Tart = require("../index");
require("jest");
jest.setTimeout(20000);
beforeAll(() => {
    const serviceAccount = require('../../sandbox-329fc-firebase-adminsdk.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    Tart.initialize({
        projectId: 'sandbox-329fc',
        keyFilename: './sandbox-329fc-firebase-adminsdk.json'
    });
});
describe('fetch', () => __awaiter(this, void 0, void 0, function* () {
    describe('id not found', () => {
        test('catch error', () => __awaiter(this, void 0, void 0, function* () {
            expect.hasAssertions();
            try {
                yield Tart.fetch('user', 'notfound');
            }
            catch (error) {
                expect(error.message).toBeDefined();
            }
        }));
    });
    describe('exist id', () => __awaiter(this, void 0, void 0, function* () {
        test('fetched', () => __awaiter(this, void 0, void 0, function* () {
            const user = yield admin.firestore().collection('user').add({ name: 'test' });
            const result = yield Tart.fetch('user', user.id);
            expect(result.data.name).toBe('test');
            expect(result.ref.path).toBe(user.path);
        }));
    }));
}));
describe('Snapshot', () => __awaiter(this, void 0, void 0, function* () {
    describe('constructor', () => {
        test('args are ref and data', () => __awaiter(this, void 0, void 0, function* () {
            const data = { name: 'test' };
            const userDocRef = yield admin.firestore().collection('user').add(data);
            const user = new Tart.Snapshot(userDocRef, data);
            expect(user.data).toEqual(data);
            expect(user.ref.path).toBe(userDocRef.path);
        }));
        test('args are only snapshot', () => __awaiter(this, void 0, void 0, function* () {
            const data = { name: 'test' };
            const userDocRef = yield admin.firestore().collection('user').add(data);
            const userSnapshot = yield admin.firestore().collection('user').doc(userDocRef.id).get();
            const user = new Tart.Snapshot(userSnapshot);
            expect(user.data).toEqual(data);
            expect(user.ref.path).toBe(userDocRef.path);
        }));
    });
    describe('cmakeNotSavedSnapshot', () => {
        test('return not saved snapshot', () => __awaiter(this, void 0, void 0, function* () {
            const data = { name: 'test' };
            const user = Tart.Snapshot.makeNotSavedSnapshot('user', data);
            expect.assertions(2);
            expect(user.data).toEqual(data);
            // test: document is not found
            try {
                yield Tart.fetch('user', user.ref.id);
            }
            catch (error) {
                expect(error.message).toBeDefined();
            }
        }));
    });
}));
