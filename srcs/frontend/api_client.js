/**
 * Represents an API client for making HTTP requests
 * to the backend server pong.
 * @class
 */
class ApiClient {
  constructor (baseUrl) {
    this.baseUrl = new URL(baseUrl);
    this.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // dev only
    if (typeof localStorage !== 'undefined') {
      this.headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Cookie: localStorage.getItem('sessionid'),
      };
    }
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

  async authorize (body, query = null) {
    const response = await this.sendRequest('login', 'POST', body, query);
    const cookie = response.headers.get('set-cookie');

    // dev only
    if (typeof localStorage === 'undefined') {
      this.headers.Cookie = cookie;
      return response;
    }
    localStorage.setItem('sessionid', cookie);
    return response;
  }

  async logout () {
    const response = await this.sendRequest('logout', 'POST', null, null);
    // dev only
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('sessionid');
    }
    return response;
  }
};

export default ApiClient;
