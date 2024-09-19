import { readFileSync } from 'fs';
import { buildSchema } from 'graphql';
import path from 'path';
import { fileURLToPath } from 'url';

export function importSchema() {
  // const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
  // const __dirname = path.dirname(__filename); // get the name of the directory
  // Load and parse schema from file
  const schemaString = readFileSync(`${path.join(__dirname, 'schema.gql')}`, 'utf8');

  return buildSchema(schemaString);
}
