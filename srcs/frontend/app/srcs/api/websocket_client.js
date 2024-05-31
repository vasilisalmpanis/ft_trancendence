let instances = new Map();

class WebsocketClient {

  constructor(endpoint, access_token) {
    if (instances.has(endpoint)) {
        return instances.get(endpoint);
    }
    instances.set(endpoint, this);
    this.endpoint = endpoint;
    this.ws = new WebSocket(endpoint, ["Authorization", access_token]);
  }

  getWs() {
    return this.ws;
  }
  close () {
    instances.delete(this.endpoint);
    if (this.ws) {
        this.ws.close();
    }
  }
  static has(endpoint) {
    return instances.has(endpoint);
  }
}

export default WebsocketClient;