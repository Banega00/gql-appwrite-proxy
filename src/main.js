import { Client, Users } from 'node-appwrite';
import resolvers from './resolvers.js';
import { parse, buildSchema, graphql } from 'graphql';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

let value = 10;

// This Appwrite function will be executed every time your function is triggered
export default async ({ req, res, log, error }) => {
  value += 10;

  log(`Value is now ${value}`);

  res.json({ message: `Value is now ${value}` }).status(200);
};
