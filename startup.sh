#!/bin/sh

# Wait for database to be ready
echo "Waiting for database to be ready..."
until pg_isready -h database -p 5432 -U postgres; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready!"

# Run database migrations
echo "Running database migrations..."
pnpm prisma migrate deploy

# Create admin user
echo "Creating admin user..."
node create-admin-user.js

# Start the application
echo "Starting application..."
pnpm start
