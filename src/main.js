import { Client, Users } from 'node-appwrite';
import { parse, buildSchema, graphql } from 'graphql';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import AppExpress from '@itznotabug/appexpress';

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

// const appExpress = new AppExpress();

// Simple GET route
// appExpress.get('/', (request, response) => {
//   response.send('Welcome to AppExpress!');
// });

// JSON response
// appExpress.post('/hello', (request, response) => {
//   response.json({ message: 'Hello World' });
// });

// export default async (context) => await appExpress.attach(context);


// This Appwrite function will be executed every time your function is triggered
export default async ({ req, res, log, error }) => {
  // You can use the Appwrite SDK to interact with other services
  // For this example, we're using the Users service
  // const client = new Client()
  //   .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
  //   .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
  //   .setKey(req.headers['x-appwrite-key'] ?? '');
  // const users = new Users(client);

  try {
    log(`typeof req.bodyJson: ${typeof req.bodyJson}`);
    log(req.bodyJson);
    log(`typeof req.body: ${typeof req.body}`);
    log(req.body);
    const { query, variables } = req.body;

    log(query);

    const result = await graphql({
      schema: importSchema(),
      source: query,
      rootValue: resolvers,
      variableValues: variables,
    });

    log('Success');
    return res.json(result, 200);
  } catch (error) {
    log('Invalid Graphql query');
    return res.json({ error: error.message }, 500);
  }
  // Send a response to the user
  res.json({ message: 'Hello from Appwrite!' });
};
