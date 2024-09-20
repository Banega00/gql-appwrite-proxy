import { graphql, parse } from 'graphql';
import { resolvers } from './resolvers.js';
import { importSchema } from './schema.js';
import { Context } from './types.js';
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
export default async (context: Context) => {
  const { req, res, log, error } = context;
  // You can use the Appwrite SDK to interact with other services
  // For this example, we're using the Users service
  // const client = new Client()
  //   .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
  //   .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
  //   .setKey(req.headers['x-appwrite-key'] ?? '');
  // const users = new Users(client);

  try {
    const { query, variables } = req.body;
    // console.log(typeof query);
    // console.log(parsedQuery);
    const result = await graphql({
      schema: importSchema(),
      source: query,
      rootValue: resolvers,
      variableValues: variables,
      contextValue: { req, res, log, error },
    });
    return res.json(result, 200);
  } catch (error: any) {
    log('Invalid Graphql query');
    return res.json({ error: error.message }, 500);
  }
};
