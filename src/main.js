"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const resolvers_js_1 = require("./resolvers.js");
const schema_js_1 = require("./schema.js");
const appwrite_service_js_1 = require("./appwrite-service.js");
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
exports.default = (context) => __awaiter(void 0, void 0, void 0, function* () {
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
        const result = yield (0, graphql_1.graphql)({
            schema: (0, schema_js_1.importSchema)(),
            source: query,
            rootValue: resolvers_js_1.resolvers,
            variableValues: variables,
        });
        log(appwrite_service_js_1.appwriteService.test());
        return res.json(result, 200);
    }
    catch (error) {
        log('Invalid Graphql query');
        return res.json({ error: error.message }, 500);
    }
});
