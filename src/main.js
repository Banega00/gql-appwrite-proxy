import { Client, Users } from 'node-appwrite';
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

const resolvers = {
  health() {
    return 'health';
  },
};

// This Appwrite function will be executed every time your function is triggered
export default async ({ req, res, log, error: logError }) => {
  // You can use the Appwrite SDK to interact with other services
  // For this example, we're using the Users service
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
  const users = new Users(client);

  if (req.path == '/graphql') {
    try {
      log('THIS IS TYPE OF REQ');
      log(typeof req);

      log('THIS IS REQ.PAYLOAD');
      log(req.payload);


      log('THIS ARE REQ KEYS');
      log(Object.keys(req).join(', '));


      log('THIS ARE REQ KEYS');
      log(Object.keys(req));

      log('THIS IS BODY!');
      log(req.body);
      log('THIS IS PAYLOAD');
      log(req.payload);

      log('BOOLEAN BODY');
      log(new Boolean(req.body));

      log('BOOLEAN PAYLOAD');
      log(new Boolean(req.payload));

      log('BOOLEAN REQ');
      log(new Boolean(req));

      const { query, variables } = JSON.parse(req.body);

      log(query);

      const result = await graphql({
        schema: importSchema(),
        source: query,
        rootValue: resolvers,
        variableValues: variables,
      });

      log('Success');
      log('STRINGIFIED RESULT');
      log(JSON.stringify(result));
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
