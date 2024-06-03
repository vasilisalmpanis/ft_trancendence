# ft_transcendence
## Pong online game

This repository contains the source code for an online version of the classic Pong game. The game supports online players connecting over the web to compete in real-time.

## Running the app on localhost

Follow these instructions to get your copy of the project up and running on your local machine for development and testing purposes.

1. Clone the repository:
   ```bash
   git clone git@github.com:vasilisalmpanis/ft_transcendence.git
   ```
2. Create an .env file containing your applications env variables and place it in the `srcs` directory. You can use the provided `.env_sample` file as a template:
    ```bash
    cd ft_transcendence/srcs
    cp .env_sample .env
    ```
    Environment variables required in .env are:
    ```bash
    DB_USER=postgres        # Database user
    DB_PASSWORD=postgres    # Database password
    DB_NAME=postgres        # Database name
    DB_HOST=postgres        # Database hostname
    DB_PORT=5432            # Database port
    DJANGO_SECRET_KEY='django secret key'   # Secret key for django. Generate it.
    JWT_SECRET='generate with jwt'          # Secret key for JWT tokens. Generate.
    FERNET_SECRET="generate with fernet"    #
    OAUTH_UID='uid'       # uid of your Oauth application from 42 Intra
    OAUTH_SECRET='secret' # temporary secret of your Oauth application from 42 Intra
    OAUTH_STATE='state'   # state for validation of Oauth requests
    RANDOM_OAUTH_USER_PASSWORD=`randompassword12345thisisnotimportant` # a password for users created by Oauth (unused)
    REDIS_HOST=redis            # Redis hostname
    REDIS_PORT=6379            # Redis port
    ```

3. Put a SSL certificate and key (localhost.crt, localhost.key) into the `srcs/frontend` directory. Run the following command in the root directory of the application to generate new certificates and move them in the correct directory:
    ```bash
    openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes -keyout localhost.key -out localhost.crt
    cp localhost.key localhost.crt srcs/frontend/
    ```

4. Run the application from the srcs directory with the following command:
    ```bash
    docker-compose up
    ```

5. Endpoints:
    * http://localhost - Frontend
    * http://localhost:8000/healthcheck - Backend

6. To make the OAuth work, you need to create an OAuth application on the 42 Intra platform. Set the redirect URI to `https://localhost/api/oauth2/redir` and add the generated UID and SECRET of the application to the .env file.

## CLI client extensive documentation:
To install the CLI client, you need python3.10 or higher installed on your machine. We use poetry to manage the dependencies of the cli application.<br/><br/>
1. Run the following commands from the cli directory to install the CLI client on your machine:
    ```bash
    pip3 install poetry
    poetry install
    poetry build 
    pip install .
    ``` 

2. To run the CLI client, you can use the following command:
    ```bash
    python3 -m transcendence_cli
    ```


