import { GraphQLError } from 'graphql';

export function handleGraphQLErrorsFromAPI(responseData: { errors?: any }) {
  if (responseData?.errors && responseData.errors.length > 0) {
    const firstError = responseData.errors[0];
    // Throw a new GraphQLError with the custom message
    throw new GraphQLError(`Error from API: ${firstError.message}`, {
      extensions: {
        path: firstError.path,
        location: firstError.locations,
        ...firstError.extensions,
      },
    });
  }
}
