import axios, { isAxiosError } from 'axios';

export class ApiServerService {
  constructor() {}

  async sendPostGraphQLRequest(query: any, authorization?: string) {
    try {
      const response = await axios('https://4190-87-116-166-28.ngrok-free.app/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authorization,
        },
        data: JSON.stringify(query),
      });

      const data = response.data;
      return data as { data: any; errors: any };
    } catch (error) {
      console.log('Error communicating with API server');
      if (isAxiosError(error)) {
        console.log(error.response?.data);
      }
      throw error;
    }
  }
}

export const apiServerService = new ApiServerService();
