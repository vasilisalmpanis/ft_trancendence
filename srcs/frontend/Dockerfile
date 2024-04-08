FROM node:alpine AS build
COPY ./app /app
WORKDIR /app
RUN npm install && npm run build
FROM nginx:alpine AS prod
COPY nginx.conf /etc/nginx/
COPY localhost.crt /etc/ssl/certs/
COPY localhost.key /etc/ssl/private/
COPY  --from=build /app/dist /app
CMD ["nginx", "-g", "daemon off;"]