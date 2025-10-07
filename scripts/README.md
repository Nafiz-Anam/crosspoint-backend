# Admin User Creation Scripts

This directory contains scripts to create an admin user for the Crosspoint application.

## Available Scripts

### JavaScript Version (Recommended)

```bash
cd backend
node create-admin-user.js
```

### TypeScript Version

```bash
cd backend
npx ts-node create-admin-user.ts
```

## Admin User Details

- **Email**: admin@gmail.com
- **Password**: Nafiz@1122
- **Role**: ADMIN
- **Permissions**: All available permissions
- **Status**: Active and email verified

## What the Script Does

1. Checks if an admin user already exists
2. Hashes the password using bcrypt
3. Creates a new employee record with ADMIN role
4. Assigns all available permissions
5. Sets the user as active and email verified

## Prerequisites

- Database connection must be configured
- Prisma client must be generated (`pnpm prisma generate`)
- All dependencies must be installed (`pnpm install`)

## Troubleshooting

If you encounter any issues:

1. Make sure the database is running and accessible
2. Ensure the DATABASE_URL environment variable is set correctly
3. Run `pnpm prisma generate` to ensure Prisma client is up to date
4. Check that all required dependencies are installed
