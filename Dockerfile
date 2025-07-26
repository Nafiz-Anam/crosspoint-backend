# Use the official Node.js 20 as a parent image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app/backend

# Copy package.json and package-lock.json (or yarn.lock) files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# copy prisma file
COPY prisma ./prisma

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .

# Expose port 5000 to the outside once the container has launched
EXPOSE ${PORT}

# Define the command to run your app using CMD which defines your runtime
# Here we will use node to run the application
CMD npx prisma migrate dev --name init && yarn dev