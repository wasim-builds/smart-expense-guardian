FROM node:18-alpine as build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Set the API Base URL to use the Nginx proxy path
ENV VITE_API_BASE_URL=/api
RUN npm run build

FROM nginx:alpine
# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built app
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
