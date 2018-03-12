import * as admin from 'firebase-admin'
import * as Tart from '../index'
import 'jest'

interface User extends Tart.Timestamps {
  name: string
}

interface Game extends Tart.Timestamps {
  price: number
}

jest.setTimeout(20000)
beforeAll(() => {
  const serviceAccount = require('../../sandbox-329fc-firebase-adminsdk.json')
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
  Tart.initialize(
    {
      projectId: 'sandbox-329fc',
      keyFilename: './sandbox-329fc-firebase-adminsdk.json'
    }
  )
})

describe('fetch', async () => {
  describe('id not found', () => {
    test('catch error', async () => {
      expect.hasAssertions()
      try {
        await Tart.fetch<User>('user', 'notfound')
      } catch (error) {
        expect(error.message).toBeDefined()
      }
    })
  })

  describe('exist id', async () => {
    test('fetched', async () => {
      const user = await admin.firestore().collection('user').add({ name: 'test' })
      const result = await Tart.fetch<User>('user', user.id)
      expect(result.data.name).toBe('test')
      expect(result.ref.path).toBe(user.path)
    })
  })
})

describe('Snapshot', async () => {
  describe('constructor', () => {
    test('args are ref and data', async () => {
      const data: User = { name: 'test' }
      const userDocRef = await admin.firestore().collection('user').add(data)
      const user = new Tart.Snapshot(userDocRef, data)

      expect(user.data).toEqual(data)
      expect(user.ref.path).toBe(userDocRef.path)
    })

    test('args are only snapshot', async () => {
      const data: User = { name: 'test' }
      const userDocRef = await admin.firestore().collection('user').add(data)
      const userSnapshot = await admin.firestore().collection('user').doc(userDocRef.id).get()
      const user = new Tart.Snapshot<User>(userSnapshot)

      expect(user.data).toEqual(data)
      expect(user.ref.path).toBe(userDocRef.path)
    })
  })

  describe('cmakeNotSavedSnapshot', () => {
    test('return not saved snapshot', async () => {
      const data: User = { name: 'test' }
      const user = Tart.Snapshot.makeNotSavedSnapshot('user', data)

      expect.assertions(2)
      expect(user.data).toEqual(data)
      // test: document is not found
      try {
        await Tart.fetch('user', user.ref.id)
      } catch (error) {
        expect(error.message).toBeDefined()
      }
    })
  })
})
