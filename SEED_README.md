# Database Seeding Scripts

This directory contains comprehensive database seeding scripts for the Crosspoint application. These scripts populate all database tables with realistic Italian data for testing and development purposes.

## Available Scripts

### JavaScript Version (Recommended)

```bash
cd backend
npm run seed
# or
node seed-database.js
```

### TypeScript Version

```bash
cd backend
npm run seed:ts
# or
npx ts-node seed-database.ts
```

## What Gets Seeded

The seed script creates the following data with **at least 12 items per table**:

### 🏢 Branches (15 branches)

- Italian cities with proper postal codes and provinces
- Realistic branch names and addresses
- Contact information (phone, email)

### 🏦 Bank Accounts (15 accounts)

- Italian bank names (Intesa Sanpaolo, UniCredit, etc.)
- Valid IBAN format
- SWIFT codes and account numbers

### 🔧 Services (20 services)

- Professional service categories
- Realistic pricing (50-550 EUR)
- Italian service names

### 👥 Employees (15 employees)

- Italian names and surnames
- Valid Italian tax codes (codice fiscale)
- Different roles (ADMIN, HR, MANAGER, EMPLOYEE)
- Proper permission assignments
- Profile images from DiceBear API

### 👤 Clients (15 clients)

- Italian names and contact information
- Valid Italian tax codes
- Realistic addresses across Italian cities

### 📋 Tasks (15 tasks)

- Professional task titles in Italian
- Various statuses (PENDING, IN_PROGRESS, COMPLETED, etc.)
- Realistic time estimates and completion dates

### 🧾 Invoices (15 invoices)

- Proper invoice numbering
- Italian VAT calculations (22%)
- Various payment methods
- Company information fields

### 📄 Invoice Items (30 items)

- 2 items per invoice
- Service descriptions and pricing
- Discount calculations

### ⏰ Attendance Records (180 records)

- 12 records per employee
- Various attendance statuses
- Realistic check-in/check-out times
- Total hours calculations

### 🔐 OTP Records (15 records)

- 6-digit verification codes
- Expiration timestamps
- Attempt tracking

### 🎫 Token Records (30 records)

- 2 tokens per employee
- Different token types (ACCESS, REFRESH, etc.)
- Proper expiration times

## Data Features

### 🇮🇹 Italian Localization

- **Cities**: Roma, Milano, Napoli, Torino, Palermo, etc.
- **Provinces**: Proper 2-letter Italian province codes
- **Postal Codes**: Valid Italian CAP codes
- **Names**: Realistic Italian first and last names
- **Tax Codes**: Valid Italian codice fiscale format
- **Phone Numbers**: Italian mobile number format
- **Banking**: Italian bank names and IBAN format

### 🔗 Proper Relationships

- All foreign key relationships are maintained
- Realistic data distribution across branches
- Proper employee-client assignments
- Task-invoice relationships

### 📊 Realistic Data

- **Pricing**: Professional service rates
- **Dates**: 2024 date range for all records
- **Statuses**: Varied status distributions
- **Time Tracking**: Realistic work hours
- **Financial**: Proper tax calculations

## Prerequisites

1. **Database Connection**: Ensure your database is running and accessible
2. **Environment Variables**: Set up your `DATABASE_URL` in `.env`
3. **Prisma Client**: Generate the Prisma client
   ```bash
   npx prisma generate
   ```
4. **Dependencies**: Install all required packages
   ```bash
   npm install
   ```

## Usage

### First Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Push database schema
npx prisma db push

# 4. Run seed script
npm run seed
```

### Reset and Reseed

```bash
# The seed script automatically clears existing data
npm run seed
```

### Verify Data

```bash
# Open Prisma Studio to view seeded data
npx prisma studio
```

## Script Behavior

### Data Clearing

The script automatically clears existing data in the correct order to maintain referential integrity:

1. Invoice Items
2. Invoices
3. Tasks
4. Attendance
5. Tokens
6. OTPs
7. Clients
8. Employees
9. Services
10. Bank Accounts
11. Branches

### Error Handling

- Comprehensive error logging
- Graceful failure handling
- Database connection cleanup
- Process exit codes for CI/CD

### Logging

- Progress indicators for each table
- Summary statistics
- Success/failure messages
- Emoji indicators for better readability

## Customization

### Adding More Data

To increase the number of records, modify the loop counters in the script:

```javascript
// Change from 15 to desired number
for (let i = 0; i < 25; i++) {
  // ... create more records
}
```

### Modifying Data Patterns

- **Names**: Update `italianNames` array
- **Cities**: Modify `italianCities` array
- **Services**: Update `serviceNames` and `serviceCategories`
- **Pricing**: Adjust price ranges in service creation

### Adding New Tables

1. Add table creation logic after clearing existing data
2. Update the summary logging
3. Ensure proper foreign key relationships

## Troubleshooting

### Common Issues

1. **Database Connection Error**

   - Verify `DATABASE_URL` in `.env`
   - Ensure database server is running
   - Check network connectivity

2. **Prisma Client Error**

   - Run `npx prisma generate`
   - Check Prisma schema syntax
   - Verify database schema matches Prisma schema

3. **Foreign Key Constraint Error**

   - Ensure data is created in correct order
   - Check that referenced records exist
   - Verify foreign key relationships in schema

4. **Memory Issues with Large Datasets**
   - Reduce batch sizes
   - Process data in smaller chunks
   - Monitor system memory usage

### Debug Mode

For detailed debugging, you can modify the script to add more logging:

```javascript
console.log("Creating employee:", employeeData);
```

## Security Notes

- **Passwords**: All employee passwords are set to "Password123!" for testing
- **Sensitive Data**: No real personal information is used
- **Production**: Never run this script in production without modification
- **Data Privacy**: Generated data is fictional and safe for testing

## Support

If you encounter issues:

1. Check the console output for specific error messages
2. Verify all prerequisites are met
3. Ensure database schema is up to date
4. Check Prisma client generation
5. Review foreign key relationships

For additional help, refer to the main project documentation or create an issue in the repository.
