"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppwriteConfig = void 0;
exports.AppwriteConfig = {
    APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
    APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
};
