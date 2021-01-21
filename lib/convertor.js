"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const checkDateObject = (request) => {
    return (request instanceof Date) || (request instanceof admin.firestore.Timestamp);
};
const convertDateObject = (request, ignore) => {
    if (request instanceof Date && ignore === 'Timestamp') {
        const date = request;
        return admin.firestore.Timestamp.fromDate(date);
    }
    else if (request instanceof admin.firestore.Timestamp && ignore === 'Date') {
        const date = request;
        return date.toDate();
    }
    else {
        return request;
    }
};
const convertData = (request, ignore) => {
    if (checkDateObject(request)) {
        return convertDateObject(request, ignore);
    }
    else if (Array.isArray(request)) {
        return convertList(request, ignore);
    }
    else if ((typeof request === 'object') && !(request instanceof admin.firestore.GeoPoint) && !(request instanceof admin.firestore.DocumentReference)) {
        return convertObject(request, ignore);
    }
    else {
        return request;
    }
};
const convertList = (request, ignore) => {
    return request.map((data) => convertData(data, ignore));
};
const convertObject = (request, ignore) => {
    let result = {};
    Object.keys(request).forEach((attr) => {
        result[attr] = convertData(request[attr], ignore);
    });
    return result;
};
exports.convertToInput = (data) => {
    return convertObject(data, 'Timestamp');
};
exports.convertToOutput = (data) => {
    return convertObject(data, 'Date');
};
