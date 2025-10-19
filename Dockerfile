FROM node:20.16.0-alpine

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy source code (including .env.docker)
COPY . .

# Copy the docker environment file to production env
COPY .env.development .env.production

# Generate Prisma client
RUN pnpm prisma generate

# Build the app
RUN pnpm build

# Install postgresql-client for pg_isready
RUN apk add --no-cache postgresql-client

# Make startup script executable
RUN chmod +x startup.sh

EXPOSE 8000

CMD ["./startup.sh"]