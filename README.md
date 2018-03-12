# tart
Tart is a thin wrapper for Cloud Functions.

Let's define the model and write Cloud Functions with TypesScript.

# Installation

```
npm install @star__hoshi/tart --save
yarn add @star__hoshi/tart
```

# Usage

## Initialize

```ts
import * as Tart from '@star__hoshi/tart'

// Use admin sdk
Tart.initialize({
  projectId: 'sandbox-329fc',
  keyFilename: './sandbox-329fc-firebase-adminsdk.json'
})

// on cloud functions
Tart.initialize(functions.config().firebase)
```

## Define Interface

You have to extend `Tart.Timestamps`.

```ts
interface User extends Tart.Timestamps {
  name: string
}

interface Game extends Tart.Timestamps {
  price: string
}
```

## Sample Cloud Functions

```ts
exports.updateUser = functions.firestore.document('user/{userId}')
  .onCreate(async event => {
    const user = new Tart.Snapshot<User>(event.data)
    console.log(user.data.name) // => old name
    console.log(user.ref) // => DocumentReference

    await user.update({ name: 'new name'})
    console.log(user.data.name) // => new name

    return undefined
})
```

## Data Management

### Save (Create)

```ts
const data: User = { name: 'test' }
const user = Tart.Snapshot.makeNotSavedSnapshot('user', data)

// Save a document
await user.save()

// Batched writes
const batch = admin.firestore().batch()
user.saveWithBatch(batch)
await batch.commit()
```

### Save Reference Collection

Reference Collection's description is [here](https://github.com/1amageek/pring#nested-collection--reference-collection).

```ts
const user = Tart.Snapshot.makeNotSavedSnapshot<User>('user', { name: 'test' })
const game = Tart.Snapshot.makeNotSavedSnapshot<Game>('game', { price: 1000 })

const batch = admin.firestore().batch()
user.saveWithBatch(batch)
user.saveReferenceCollectionWithBatch(batch, 'games', game.ref)
game.saveWithBatch(batch)
await batch.commit()
```

### Save Nested Collection

TODO

### Read (Get)

Pass path or ref as argument.

```ts
const savedUser = await Tart.fetch<User>({ path: 'user', id: 'id' })
const savedUser = await Tart.fetch<User>(userDocumentReference)
```

### Update

```ts
const savedUser = await Tart.fetch<User>({ path: 'user', id: 'id' })

// Update a document
await savedUser.update({ name: 'new name' })

// Batched writes
savedUser.saveWithBatch(batch)
savedUser.updateWithBatch(batch, { name: 'new name' })
await savedUser.commit()
```
