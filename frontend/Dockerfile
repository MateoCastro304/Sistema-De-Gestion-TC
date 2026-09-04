FROM node:20-alpine AS development
WORKDIR /app
COPY ./frontend/package*.json /app/
RUN npm ci
COPY ./frontend .
EXPOSE 5173
CMD [ "npm", "run", "dev" ]

FROM node:20-alpine AS build
WORKDIR /app
COPY ./frontend/package*.json /app/
RUN npm ci
COPY ./frontend /app
RUN npm run build

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
