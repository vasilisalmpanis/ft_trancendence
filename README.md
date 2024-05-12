# ft_transcendence
## Pong online game

This repository contains the source code for an online version of the classic Pong game. The game supports online players connecting over the web to compete in real-time.

## Getting Started

Follow these instructions to get your copy of the project up and running on your local machine for development and testing purposes.

1. Clone the repository:
   ```bash
   git clone git@github.com:vasilisalmpanis/ft_transcendence.git
   ```
2. Create .env file (should be located in srcs directory)
    ```bash
    cd ft_transcendence/srcs
    cp .env_sample .env

    # Environment variables required in .env:

    DB_USER=postgres        # Database user
    DB_PASSWORD=postgres    # Database password
    DB_NAME=postgres        # Database name
    DB_HOST=postgres        # Database hostname
    DB_PORT=5432            # Database port
    DJANGO_SECRET_KEY='django secret key'   # Secret key for django. Generate it.
    JWT_SECRET='generate with jwt'          # Secret key for JWT tokens. Generate.
    FERNET_SECRET="generate with fernet"    #
    OAUTH_UID=uid       # uid of your Oauth application from 42 Intra
    OAUTH_SECRET=secret # temporary secret of your Oauth application from 42 Intra
    OAUTH_STATE=solid   #
    RANDOM_OAUTH_USER_PASSWORD=randompassword12345thisisnotimportant # ?
    PGADMIN_EMAIL=example@gmail.com # Email for PGAdmin web interface
    PGADMIN_PASSWORD=12345          # Password for PGAdmin web interface
    ```

3. Put SSL certificate and key (localhost.crt, localhost.key) into srcs/frontend directory. You can generate them this way:
    ```bash
    openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes -keyout localhost.key -out localhost.crt
    cp localhost.key localhost.crt srcs/frontend/
    ```

4. Run application.
    ```bash
    docker-compose up
    ```
5. Endpoints:
    * http://localhost - Frontend
    * http://localhost:5050 - PGAdmin. Username and password - from .env file
    * http://localhost:3000 - Grafana
    * http://localhost:8000/healthcheck - Backend
