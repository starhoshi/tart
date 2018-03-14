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
  Tart.initialize(admin.firestore())
})

describe('fetch', async () => {
  describe('id not found', () => {
    test('catch error', async () => {
      expect.hasAssertions()
      try {
        await Tart.fetch<User>({ path: 'user', id: 'id' })
      } catch (error) {
        expect(error.message).toBeDefined()
      }
    })
  })

  describe('exist id', async () => {
    test('fetched', async () => {
      const user = await admin.firestore().collection('user').add({ name: 'test' })
      const result = await Tart.fetch<User>(user)
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

  describe('makeNotSavedSnapshot', () => {
    test('return not saved snapshot', async () => {
      const data: User = { name: 'test' }
      const user = Tart.Snapshot.makeNotSavedSnapshot('user', data)

      expect.assertions(2)
      expect(user.data).toEqual(data)
      // test: document is not found
      try {
        await Tart.fetch(user.ref)
      } catch (error) {
        expect(error.message).toBeDefined()
      }
    })
  })

  describe('save', () => {
    test('save succeeded', async () => {
      const data: User = { name: 'test' }
      const user = Tart.Snapshot.makeNotSavedSnapshot('user', data)

      await user.save()
      const savedUser = await Tart.fetch<User>(user.ref)
      expect(savedUser.data).toEqual(user.data)
      expect(savedUser.data.createdAt!.getTime()).toBeDefined()
      expect(savedUser.data.updatedAt!.getTime()).toBeDefined()
      expect(savedUser.ref.path).toEqual(user.ref.path)
    })
  })

  describe('saveWithBatch', () => {
    describe('only one saveWithBatch', () => {
      test('save succeeded', async () => {
        const data: User = { name: 'test' }
        const user = Tart.Snapshot.makeNotSavedSnapshot('user', data)

        const batch = admin.firestore().batch()
        user.saveWithBatch(batch)
        await batch.commit()

        const savedUser = await Tart.fetch<User>(user.ref)
        expect(savedUser.data).toEqual(user.data)
        expect(savedUser.data.createdAt!.getTime()).toBeDefined()
        expect(savedUser.data.updatedAt!.getTime()).toBeDefined()
        expect(savedUser.ref.path).toEqual(user.ref.path)
      })
    })

    describe('multiple saveWithBatch', () => {
      test('save succeeded', async () => {
        const userData: User = { name: 'test' }
        const gameData: Game = { price: 1000 }
        const user = Tart.Snapshot.makeNotSavedSnapshot('user', userData)
        const game = Tart.Snapshot.makeNotSavedSnapshot('game', gameData)

        const batch = admin.firestore().batch()
        user.saveWithBatch(batch)
        game.saveWithBatch(batch)
        await batch.commit()

        const savedUser = await Tart.fetch<User>(user.ref)
        expect(savedUser.data).toEqual(user.data)
        expect(savedUser.ref.path).toEqual(user.ref.path)
        const savedGame = await Tart.fetch<Game>(game.ref)
        expect(savedGame.data).toEqual(game.data)
        expect(savedGame.ref.path).toEqual(game.ref.path)
      })
    })
  })

  describe('setReferenceCollectionWithBatch', () => {
    test('save succeeded', async () => {
      const userData: User = { name: 'test' }
      const gameData: Game = { price: 1000 }
      const user = Tart.Snapshot.makeNotSavedSnapshot('user', userData)
      const game = Tart.Snapshot.makeNotSavedSnapshot('game', gameData)

      const batch = admin.firestore().batch()
      user.saveWithBatch(batch)
      user.saveReferenceCollectionWithBatch(batch, 'games', game.ref)
      game.saveWithBatch(batch)
      await batch.commit()

      const savedUser = await Tart.fetch(user.ref)
      expect(savedUser.data).toEqual(user.data)
      expect(savedUser.ref.path).toEqual(user.ref.path)
      const gameQuerySnapshot = await savedUser.ref.collection('games').get()
      const gameRefColData = await gameQuerySnapshot.docs[0].data()
      expect(gameRefColData.createdAt.getTime()).toBeDefined()
      expect(gameRefColData.updatedAt!.getTime()).toBeDefined()
      const savedGame = await Tart.fetch<Game>({ path: 'game', id: gameQuerySnapshot.docs[0].id })
      expect(savedGame.data).toEqual(game.data)
      expect(savedGame.ref.path).toEqual(game.ref.path)
    })
  })

  describe('update', () => {
    test('update succeeded', async () => {
      const data: User = { name: 'test' }
      const user = Tart.Snapshot.makeNotSavedSnapshot('user', data)
      await user.save()

      await user.update({ name: 'new name' })

      const savedUser = await Tart.fetch<User>(user.ref)
      expect(savedUser.data.name).toEqual('new name')
      expect(savedUser.data.createdAt!.getTime()).toBe(user.data.createdAt!.getTime())
      expect(savedUser.data.updatedAt!.getTime()).toBe(user.data.updatedAt!.getTime())
      expect(savedUser.data.updatedAt!.getTime()).not.toBe(user.data.createdAt!.getTime())
      expect(savedUser.ref.path).toEqual(user.ref.path)
    })
  })

  describe('updateWithBatch', () => {
    test('update succeeded', async () => {
      const data: User = { name: 'test' }
      const user = Tart.Snapshot.makeNotSavedSnapshot('user', data)
      await user.save()

      const batch = admin.firestore().batch()
      await user.updateWithBatch(batch, { name: 'new name' })
      await batch.commit()

      const savedUser = await Tart.fetch<User>(user.ref)
      expect(savedUser.data.name).toEqual('new name')
      expect(savedUser.data.createdAt!.getTime()).toBe(user.data.createdAt!.getTime())
      expect(savedUser.data.updatedAt!.getTime()).toBe(user.data.updatedAt!.getTime())
      expect(savedUser.data.updatedAt!.getTime()).not.toBe(user.data.createdAt!.getTime())
      expect(savedUser.ref.path).toEqual(user.ref.path)
    })
  })
})
