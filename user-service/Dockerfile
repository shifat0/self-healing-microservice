# Use a Node.js base image
FROM node:24-alpine AS development

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock) to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the NestJS application
RUN npm run build

# Stage 2: Production image
FROM node:24-alpine AS production

WORKDIR /usr/src/app

# ** NEW: Install curl for health checks **
RUN apk add --no-cache curl

# Copy built application from the development stage
COPY --from=development /usr/src/app/node_modules ./node_modules
COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/package*.json ./

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD [ "node", "dist/main" ]