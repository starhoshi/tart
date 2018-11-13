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
        await Tart.fetch<User>('user', 'id')
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

describe('refresh', async () => {
  test('refresh data', async () => {
    const user = await admin.firestore().collection('user').add({ name: 'test' })
    const result = await Tart.fetch<User>(user)

    await user.update({ name: 'refreshed' })
    expect(result.data.name).toBe('test')

    await result.refresh()
    expect(result.data.name).toBe('refreshed')
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

  describe('firestoreURL', async () => {
    test('refresh data', async () => {
      const user = await admin.firestore().collection('user').add({ name: 'test' })
      const result = await Tart.fetch<User>(user)

      expect(result.firestoreURL).toBeDefined()
    })
  })

  describe('makeNotSavedSnapshot', () => {
    describe('with id', () => {
      test('ref id is hoge.ref.id', async () => {
        const hoge = admin.firestore().collection('hoge').doc()
        const data: User = { name: 'test' }
        const user = Tart.makeNotSavedSnapshot('user', data, hoge.id)

        await user.save()
        const savedUser = await Tart.fetch<User>(user.ref)
        expect(savedUser.ref.id).toBe(hoge.id)
      })
    })
    test('return not saved snapshot', async () => {
      const data: User = { name: 'test' }
      const user = Tart.makeNotSavedSnapshot('user', data)

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
      const user = Tart.makeNotSavedSnapshot('user', data)

      await user.save()
      const savedUser = await Tart.fetch<User>(user.ref)
      expect(savedUser.data).toEqual(user.data)
      expect(savedUser.data.createdAt!.getTime()).toBeDefined()
      expect(savedUser.data.updatedAt!.getTime()).toBeDefined()
      expect(savedUser.ref.path).toEqual(user.ref.path)
    })
    describe('save same id', async () => {
      test('throwd ALREADY_EXISTS', async () => {
        const data: User = { name: 'test' }
        const user1 = Tart.makeNotSavedSnapshot('user', data)
        const user2 = Tart.makeNotSavedSnapshot('user', data, user1.ref.id)

        await user1.save()

        expect.hasAssertions()
        try {
          await user2.save()
        } catch (error) {
          expect(error).toBeDefined()
        }
      })
    })
  })

  describe('saveWithBatch', () => {
    describe('only one saveWithBatch', () => {
      test('save succeeded', async () => {
        const data: User = { name: 'test' }
        const user = Tart.makeNotSavedSnapshot('user', data)

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
        const user = Tart.makeNotSavedSnapshot('user', userData)
        const game = Tart.makeNotSavedSnapshot('game', gameData)

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

  describe('saveReferenceCollection', () => {
    test('save succeeded', async () => {
      const userData: User = { name: 'test' }
      const gameData: Game = { price: 1000 }
      const user = Tart.makeNotSavedSnapshot('user', userData)
      const game = Tart.makeNotSavedSnapshot('game', gameData)

      await user.save()
      await user.saveReferenceCollection('games', game)
      await game.save()

      const savedUser = await Tart.fetch(user.ref)
      expect(savedUser.data).toEqual(user.data)
      expect(savedUser.ref.path).toEqual(user.ref.path)
      const gameQuerySnapshot = await savedUser.ref.collection('games').get()
      const gameRefColData = await gameQuerySnapshot.docs[0].data()
      expect(gameRefColData.createdAt.getTime()).toBeDefined()
      expect(gameRefColData.updatedAt!.getTime()).toBeDefined()
      const savedGame = await Tart.fetch<Game>('game', gameQuerySnapshot.docs[0].id)
      expect(savedGame.data).toEqual(game.data)
      expect(savedGame.ref.path).toEqual(game.ref.path)
    })
  })

  describe('saveReferenceCollectionWithBatch', () => {
    test('save succeeded', async () => {
      const userData: User = { name: 'test' }
      const gameData: Game = { price: 1000 }
      const user = Tart.makeNotSavedSnapshot('user', userData)
      const game = Tart.makeNotSavedSnapshot('game', gameData)

      const batch = admin.firestore().batch()
      user.saveWithBatch(batch)
      user.saveReferenceCollectionWithBatch(batch, 'games', game)
      game.saveWithBatch(batch)
      await batch.commit()

      const savedUser = await Tart.fetch(user.ref)
      expect(savedUser.data).toEqual(user.data)
      expect(savedUser.ref.path).toEqual(user.ref.path)
      const gameQuerySnapshot = await savedUser.ref.collection('games').get()
      const gameRefColData = await gameQuerySnapshot.docs[0].data()
      expect(gameRefColData.createdAt.getTime()).toBeDefined()
      expect(gameRefColData.updatedAt!.getTime()).toBeDefined()
      const savedGame = await Tart.fetch<Game>('game', gameQuerySnapshot.docs[0].id)
      expect(savedGame.data).toEqual(game.data)
      expect(savedGame.ref.path).toEqual(game.ref.path)
    })
  })

  describe('saveNestedCollection', () => {
    test('save succeeded', async () => {
      const userData: User = { name: 'test' }
      const gameData: Game = { price: 1000 }
      const user = Tart.makeNotSavedSnapshot('user', userData)
      const game = Tart.makeNotSavedSnapshot('game', gameData)

      await user.save()
      await user.saveNestedCollection('games', game)

      const savedUser = await Tart.fetch(user.ref)
      expect(savedUser.data).toEqual(user.data)
      expect(savedUser.ref.path).toEqual(user.ref.path)
      const nestedGames = await savedUser.fetchNestedCollections<Game>('games')
      expect(nestedGames[0].data.price).toBe(game.data.price)
    })
  })

  describe('saveNestedCollectionWithBatch', () => {
    test('save succeeded', async () => {
      const userData: User = { name: 'test' }
      const gameData: Game = { price: 1000 }
      const user = Tart.makeNotSavedSnapshot('user', userData)
      const game = Tart.makeNotSavedSnapshot('game', gameData)

      const batch = admin.firestore().batch()
      user.saveWithBatch(batch)
      user.saveNestedCollectionWithBatch(batch, 'games', game)
      await batch.commit()

      const savedUser = await Tart.fetch(user.ref)
      expect(savedUser.data).toEqual(user.data)
      expect(savedUser.ref.path).toEqual(user.ref.path)
      const nestedGames = await savedUser.fetchNestedCollections<Game>('games')
      expect(nestedGames[0].data.price).toBe(game.data.price)
    })
  })

  describe('update', () => {
    test('update succeeded', async () => {
      const data: User = { name: 'test' }
      const user = Tart.makeNotSavedSnapshot('user', data)
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
      const user = Tart.makeNotSavedSnapshot('user', data)
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

  describe('delete', () => {
    test('delete succeeded', async () => {
      const data: User = { name: 'test' }
      const user = Tart.makeNotSavedSnapshot('user', data)
      await user.save()

      await user.delete()

      const deletedUser = await admin.firestore().doc(user.ref.path).get()
      expect(deletedUser.exists).toBe(false)
    })
  })

  describe('deleteWithBatch', () => {
    test('update succeeded', async () => {
      const data: User = { name: 'test' }
      const user = Tart.makeNotSavedSnapshot('user', data)
      await user.save()

      const batch = admin.firestore().batch()
      await user.deleteWithBatch(batch)
      await batch.commit()

      const deletedUser = await admin.firestore().doc(user.ref.path).get()
      expect(deletedUser.exists).toBe(false)
    })
  })
})
