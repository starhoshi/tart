import * as admin from 'firebase-admin'
import { Timestamps } from './'

type IgnoreType = 'Date' | 'Timestamp'

const checkDateObject = (request: any) => {
  return (request instanceof Date) || (request instanceof admin.firestore.Timestamp)
}

const convertDateObject = (request: any, ignore: IgnoreType): any => {
  if (request instanceof Date && ignore === 'Timestamp') {
    const date = request as Date
    return admin.firestore.Timestamp.fromDate(date)
  } else if (request instanceof admin.firestore.Timestamp && ignore === 'Date') {
    const date = request as admin.firestore.Timestamp
    return date.toDate()
  } else {
    return request
  }
}

const convertData = (request: any, ignore: IgnoreType) => {
  if (checkDateObject(request)) {
    return convertDateObject(request, ignore)
  } else if (Array.isArray(request)) {
    return convertList(request, ignore)
  } else if ((typeof request === 'object') && !(request instanceof admin.firestore.GeoPoint) && !(request instanceof admin.firestore.DocumentReference)) {
    return convertObject(request, ignore)
  } else {
    return request
  }
}

const convertList = (request: any[], ignore: IgnoreType) => {
  return request.map((data) =>
    convertData(data, ignore)
  )
}

const convertObject = (request: any, ignore: IgnoreType) => {
  let result: any = {}
  Object.keys(request).forEach((attr) => {
    result[attr] = convertData(request[attr], ignore)
  })
  return result
}

export const convertToInput = <T extends Timestamps>(data: T) => {
  return convertObject(data, 'Timestamp')
}

export const convertToOutput = <T extends Timestamps>(data: T) => {
  return convertObject(data, 'Date')
}