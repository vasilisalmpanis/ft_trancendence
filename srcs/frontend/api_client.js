

class ApiClient {
    constructor(baseUrl)
    {
        this.baseUrl = baseUrl;
        this.resources = {};
    }

    createResource(resourceName)
    {
        let path = this.baseUrl + "/" + resourceName;
        let resource = {
            get: function() {
                return client.get(path);
            },
            post: function(data) {
                return client.post(path, data);
            },
            put: function(data) {
                return client.put(path, data);
            },
            delete: function(data) {
                return client.delete(path, data);
            }
        };
        return resource;
    }

    registerResource(resourceName, resource)
    {
        this.resources[resourceName] = this.createResource(resourceName);
    }

    

    // TODO : GET POST PUT DELETE 
    // TODO : Authorize. takes resource name json. Can be valid response or json
};

client = new ApiClient("localhost:8000");
client.registerResource("users");
console.log(client.baseUrl);