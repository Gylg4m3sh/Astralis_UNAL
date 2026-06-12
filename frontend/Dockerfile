# Stage 1: Build the React application
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# In Docker, the frontend is served by nginx which proxies /api/* to backend.
# So we use an empty VITE_API_URL so the frontend uses relative paths.
ARG VITE_API_URL=""
ARG VITE_USE_MOCKS=false
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_USE_MOCKS=$VITE_USE_MOCKS

RUN npm run build

# Stage 2: Serve the React application with Nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files to nginx server directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
