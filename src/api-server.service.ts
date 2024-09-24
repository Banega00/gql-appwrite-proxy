import axios, { isAxiosError } from 'axios';

export class ApiServerService {
  private apiServerURL: string;
  constructor() {
    this.apiServerURL = process.env.API_SERVER_URL || 'http://localhost:4000';
  }

  async sendPostGraphQLRequest<T = any>(query: any, authorization?: string): Promise<{ data: T; errors: any }> {
    try {
      if (authorization && !authorization.startsWith('Bearer')) {
        authorization = `Bearer ${authorization}`;
      }
      const response = await axios(`${this.apiServerURL}/graphql`, {
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
        console.log('AXIOS ERROR: ', error.response?.data);
        if (error.response?.data.errors) return error.response?.data;

      }
      throw error;
    }
  }
}

export const apiServerService = new ApiServerService();
