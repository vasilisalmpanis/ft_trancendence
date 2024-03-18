/**
 * Represents an API client for making HTTP requests
 * to the backend server pong.
 * @class
 */
class ApiClient {
  constructor (baseUrl) {
    this.baseUrl = new URL(baseUrl);
    if (typeof localStorage === 'undefined') {
      this.headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      return ;
    }
    this.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (localStorage.getItem('access_token')) {
      this.headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`;
    }
    if (localStorage.getItem('refresh_token')) {
      this.refresh_token = localStorage.getItem('refresh_token');
    }
      
    // dev only
  }

  async checkStatus (response) {
    if (!response.ok) {
      const errorData = await response;
      let errorMessage = `Error: ${response.status} ${response.statusText}`;
      if (errorData.message) {
        errorMessage += ` - ${errorData.message}`;
      }
      throw new Error(errorMessage);
    }
  }

  async sendRequest (path, method, body, query) {
    /* Makes request and returns reponse object with all its fields */
    const url = new URL(path, this.baseUrl);
    const params = {
      method,
      headers: this.headers,
    };
    if (body) {
      params.body = JSON.stringify(body);
    }
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    const response = await fetch(url, params);
    await this.checkStatus(response);
    return response;
  }

  async get (path, query) {
    const url = new URL(path, this.baseUrl);
    return await this.sendRequest(url, 'GET', null, query);
  }

  async post (path, body, query) {
    const url = new URL(path, this.baseUrl);
    return await this.sendRequest(url, 'POST', body, query);
  }

  async put (path, body, query) {
    const url = new URL(path, this.baseUrl);
    return await this.sendRequest(url, 'PUT', body, query);
  }

  async delete (path, query) {
    const url = new URL(path, this.baseUrl);
    return await this.sendRequest(url, 'DELETE', null, query);
  }

  async authorize (payload, query = null) {
    try{
      const response = await this.sendRequest('auth', 'POST', payload, query);
      const response_body = await response.json();
      const access_token = response_body.access_token;
      const refresh_token = response_body.refresh_token;
      // dev only
      if (typeof localStorage === 'undefined') {
        this.headers['Authorization'] = `Bearer ${access_token}`;
        return response;
      }
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      return response;
    }
    catch (error) {
      console.error('Error:', error);
    }
  }

  async logout () {
    const response = await this.sendRequest('logout', 'POST', null, null);
    // dev only
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    return response;
  }

  async refresh ()
  {
    if (this.refresh_token === undefined) {
      return ;
    }
    this.headers['Authorization'] = `Bearer ${this.refresh_token}`;
    const response = await this.sendRequest('auth/refresh', 'POST', null, null);
    const response_body = await response.json();
    const access_token = response_body.access_token;
    // dev only
    if (typeof localStorage === 'undefined') {
      this.headers['Authorization'] = `Bearer ${access_token}`;
      return response;
    }
    localStorage.setItem('access_token', access_token);
    return response;
  }

  async second_factor (code) {
    const response = await this.sendRequest('auth/verify', 'POST', { "2fa_code" : code }, null);
    const response_body = await response.json();
    const access_token = response_body.access_token;
    const refresh_token = response_body.refresh_token;
    // dev only
    if (typeof localStorage === 'undefined') {
      this.headers['Authorization'] = `Bearer ${access_token}`;
      return response;
    }
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    return response;
  }
  authorized() {
    return localStorage.getItem('access_token') ? true : false;
  }
};

export default ApiClient;

// TODO check expiration date of access token before making request
// TODO refresh token if access token is expired


export const apiClient = new ApiClient(`http://localhost:8000`);

export default ApiClient;
