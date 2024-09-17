import { Client, Users } from 'node-appwrite';
import resolvers from './resolvers.js';
import { parse, buildSchema, graphql } from 'graphql';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

function importSchema() {
  const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
  const __dirname = path.dirname(__filename); // get the name of the directory
  // Load and parse schema from file
  const schemaString = readFileSync(
    `${path.join(__dirname, 'schema.gql')}`,
    'utf8'
  );
  return buildSchema(schemaString);
}

// This Appwrite function will be executed every time your function is triggered
export default async ({ req, res, log, logError }) => {
  // You can use the Appwrite SDK to interact with other services
  // For this example, we're using the Users service
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
  const users = new Users(client);

  if (req.path == '/graphql') {
    try {
      const { query, variables } = req.body;

      const result = await graphql({
        schema: importSchema(),
        source: query,
        rootValue: resolvers,
        variableValues: variables,
      });

      log('Success');
      log(result);
      return res.json(result, 200);
    } catch (error) {
      logError('Error');
      logError(error);
      return res.json({ error: 'Invalid GraphQL query' }, 200);
    }
  } else {
    // Send a response to the user
    res.status(200).json({ message: 'Hello from Appwrite!' });
  }
};
