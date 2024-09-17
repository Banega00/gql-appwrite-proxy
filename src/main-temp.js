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
  // You can use the Appwrite SDK to interact with other services
  // For this example, we're using the Users service
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
  const users = new Users(client);

  const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
  const __dirname = path.dirname(__filename); // get the name of the directory
  // Load and parse schema from file
  const schemaString = readFileSync(
    `${path.join(__dirname, 'schema.gql')}`,
    'utf8'
  );
  const schema = buildSchema(schemaString);

  if (req.path == '/graphql') {
    try {
      const parsedQuery = parse(req.body.query);

      const { query, variables } = req.body;

      const result = await graphql({
        schema: schema,
        source: query,
        rootValue: resolvers,
        variableValues: variables,
      });

      return res.json(result).status(200);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ error: 'Invalid GraphQL query' });
    }
  } else {
    // Send a response to the user
    res.json({ message: 'Hello from Appwrite!' });
  }
};
