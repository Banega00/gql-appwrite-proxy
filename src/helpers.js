"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGraphQLErrorsFromAPI = handleGraphQLErrorsFromAPI;
const graphql_1 = require("graphql");
function handleGraphQLErrorsFromAPI(responseData) {
    if ((responseData === null || responseData === void 0 ? void 0 : responseData.errors) && responseData.errors.length > 0) {
        const firstError = responseData.errors[0];
        // Throw a new GraphQLError with the custom message
        throw new graphql_1.GraphQLError(`Error from API: ${firstError.message}`, {
            extensions: Object.assign({ path: firstError.path, location: firstError.locations }, firstError.extensions),
        });
    }
}
