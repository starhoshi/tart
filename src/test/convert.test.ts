import 'jest'
import { Timestamps } from '..'
import { convertToInput, convertToOutput } from '../convertor'
import * as admin from 'firebase-admin'

let dateToTimestamp = admin.firestore.Timestamp.fromDate

describe('covnertToInput', () => {
  interface Record extends Timestamps {
    timestamps: Date[]
  }

  interface User extends Timestamps {
    name: string
    address: admin.firestore.GeoPoint
    isActive: boolean
    profiles: {
      age: number
      birthDay: Date
      friend: {
        profiles: {
          birthDay: Date
        }
      }
    }
  }
  describe('list', () => {
    let yesterdayMillis = 1611068400000
    let todayMillis = 1611154800000
    let tomorrowMillis = 1611241200000
    const mock: Record = { timestamps: [new Date(yesterdayMillis), new Date(todayMillis), new Date(tomorrowMillis)] }
    test('success', () => {
      const result = convertToInput(mock)
      expect(result.timestamps.length).toBe(3)
      expect(result.timestamps[0]).toBeInstanceOf(admin.firestore.Timestamp)
      expect(result.timestamps[0].toMillis()).toBe(yesterdayMillis)
      expect(result.timestamps[1].toMillis()).toBe(todayMillis)
    })
  })
  describe('object', () => {
    const address = new admin.firestore.GeoPoint(10, 10)
    const mock: User = {
      name: 'user',
      address: address,
      isActive: true,
      profiles: {
        birthDay: new Date(),
        age: 20,
        friend: {
          profiles: {
            birthDay: new Date()
          }
        }
      }
    }
    test('success', () => {
      const result = convertToInput(mock)
      expect(result.profiles.birthDay).toBeInstanceOf(admin.firestore.Timestamp)
      expect(result.profiles.birthDay.toMillis())
        .toBe(dateToTimestamp(mock.profiles.birthDay).toMillis())
      expect(result.profiles.friend.profiles.birthDay).toBeInstanceOf(admin.firestore.Timestamp)
      expect(result.address).toBeInstanceOf(admin.firestore.GeoPoint)
      expect(result.address).toEqual(address)
    })
  })
})

describe('covnertToOutput', () => {
  interface Product extends Timestamps {
    publishedAt: admin.firestore.Timestamp
  }
  const mock: Product = {
    publishedAt: admin.firestore.Timestamp.now()
  }
  test('success', () => {
    const result = convertToOutput(mock)
    expect(result.publishedAt).toBeInstanceOf(Date)
    expect(result.publishedAt.getTime()).toBe(mock.publishedAt.toMillis())
  })
})