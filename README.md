# tart

[![npm version](https://badge.fury.io/js/%40star__hoshi%2Ftart.svg)](https://badge.fury.io/js/%40star__hoshi%2Ftart)
[![Build Status](https://travis-ci.org/starhoshi/tart.svg?branch=master)](https://travis-ci.org/starhoshi/tart)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/4f8b83b6113d4627a57500f993dce372)](https://www.codacy.com/app/kensuke1751/tart?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=starhoshi/tart&amp;utm_campaign=Badge_Grade)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Tart is a thin wrapper for Cloud Functions.

Let's define the model and write Cloud Functions with TypesScript.

# Sample

You can write like this.

```ts
import * as Tart from '@star__hoshi/tart'

Tart.initialize(functions.config().firebase)

interface User extends Tart.Timestamps {
  name: string
}

export const updateUser = functions.firestore.document('user/{userId}')
  .onCreate(async event => {
    const user = new Tart.Snapshot<User>(event.data)
    console.log(user.data.name) // => old name
    console.log(user.ref) // => DocumentReference

    await user.update({ name: 'new name'})
    console.log(user.data.name) // => new name

    return undefined
})
```

# Installation

```
npm install @star__hoshi/tart --save
yarn add @star__hoshi/tart
```

# Usage

## Initialize

```ts
import * as Tart from '@star__hoshi/tart'
import * as admin from 'firebase-admin'

admin.initializeApp(<admin.AppOptions>functions.config().firebase)

// both admin sdk and cloud functions are same interface.
Tart.initialize(admin.firestore())
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

## Snapshot Type

Snapshot has 2 local variables.

* ref
    * DocumentReference
* data
    * T extends Tart.Timestamps

```ts
const user = new Tart.Snapshot<User>(snapshot)
console.log(user.data) // => Same as snapshot.data()
console.log(user.ref) // => Same as snapshot.ref
```

## Data Management

### Save

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

[Reference|Nedted] Collection's description is [here](https://github.com/1amageek/pring#nested-collection--reference-collection).

```ts
const user = Tart.Snapshot.makeNotSavedSnapshot<User>('user', { name: 'test' })
const game = Tart.Snapshot.makeNotSavedSnapshot<Game>('game', { price: 1000 })

const batch = admin.firestore().batch()
user.saveWithBatch(batch)
user.saveReferenceCollectionWithBatch(batch, 'games', game.ref)
user.saveNestedCollectionWithBatch(batch, 'nestedgames', game.ref)
game.saveWithBatch(batch)
await batch.commit()
```

### Get

Pass path or ref as argument.

```ts
const savedUser = await Tart.fetch<User>('user', 'id')
const savedUser = await Tart.fetch<User>(userDocumentReference)
```

### Update

```ts
const savedUser = await Tart.fetch<User>('user', 'id')

// Update a document
await savedUser.update({ name: 'new name' })

// Batched writes
savedUser.saveWithBatch(batch)
savedUser.updateWithBatch(batch, { name: 'new name' })
await savedUser.commit()
```

### Delete

```ts
const savedUser = await Tart.fetch<User>('user', 'id')

// Delete a document
await savedUser.delete()

// Batched writes
savedUser.deleteWithBatch(batch)
await savedUser.commit()
```
