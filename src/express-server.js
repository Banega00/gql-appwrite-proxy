import express from 'express';
import { readFileSync } from 'fs';
import { buildSchema } from 'graphql';
import handler from './main.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
// Load and parse schema from file
const schemaString = readFileSync(
  `${path.join(__dirname, 'schema.gql')}`,
  'utf8'
);
const schema = buildSchema(schemaString);

// Initialize Express app
const app = express();

app.use(express.json());
app.use((req, res) =>
  handler({ req, res, error: console.error, log: console.log })
);

const port = 4000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/graphql`);
});
