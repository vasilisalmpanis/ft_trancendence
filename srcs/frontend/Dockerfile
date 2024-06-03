FROM node:alpine AS build
COPY ./app /app
WORKDIR /app
RUN npm install && npm run build

FROM nginx:alpine AS prod
COPY nginx.conf /etc/nginx/
RUN apk add openssl --no-cache
RUN openssl req -x509 -out /etc/ssl/certs/localhost.crt -keyout /etc/ssl/private/localhost.key \
    -newkey rsa:2048 -nodes -sha256 \
    -subj '/CN=localhost' -extensions EXT -config <( \
    printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
COPY  --from=build /app/dist /app
CMD ["nginx", "-g", "daemon off;"]