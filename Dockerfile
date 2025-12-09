FROM node:20.16.0-slim

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN apt-get update && apt-get install -y \
    openssl \
    tzdata \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Set timezone to Italian timezone
ENV TZ=Europe/Rome
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy source code (including .env.docker)
COPY . .

# Copy the docker environment file to production env
COPY .env.production .env

# Generate Prisma client with retry logic
RUN for i in 1 2 3; do \
      pnpm prisma generate && break || \
      (echo "Prisma generate attempt $i failed, retrying in $((i * 5)) seconds..." && sleep $((i * 5))); \
    done || (echo "Prisma generate failed after 3 attempts" && exit 1)

# Build the app
RUN pnpm build

# Make startup script executable
RUN chmod +x startup.sh

EXPOSE 8000

CMD ["./startup.sh"]