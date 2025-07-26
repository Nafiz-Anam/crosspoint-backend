# Branch Management System

## Overview

This application implements a comprehensive branch management system designed for Italian companies with multiple branches. The system ensures that all users, clients, and invoices are properly linked to specific branches with robust ID generation.

## Key Features

### 1. Branch Structure
- **Branch ID Format**: `BR-001`, `BR-002`, etc.
- **Italian Address Support**: City, postal code (CAP), and province fields
- **Contact Information**: Phone and email for each branch
- **Active/Inactive Status**: Soft delete functionality

### 2. ID Generation System

#### Employee IDs
- **Format**: `EMP-BR001-001`, `EMP-BR002-001`, etc.
- **Structure**: `EMP-{BranchCode}-{Sequence}`
- **Example**: `EMP-BR001-001` (First employee in branch BR-001)

#### Customer IDs
- **Format**: `CUST-BR001-001`, `CUST-BR002-001`, etc.
- **Structure**: `CUST-{BranchCode}-{Sequence}`
- **Example**: `CUST-BR001-001` (First customer in branch BR-001)

#### Invoice IDs
- **Format**: `INV-BR001-20241225-001`, `INV-BR002-20241225-002`, etc.
- **Structure**: `INV-{BranchCode}-{YYYYMMDD}-{Sequence}`
- **Example**: `INV-BR001-20241225-001` (First invoice on December 25, 2024 for branch BR-001)

### 3. Italian-Specific Validations

#### Postal Code (CAP)
- **Format**: 5 digits
- **Validation**: `/^\d{5}$/`
- **Example**: `20100` (Milan)

#### Province Code
- **Format**: 2 uppercase letters
- **Validation**: `/^[A-Z]{2}$/`
- **Example**: `MI` (Milan), `RM` (Rome), `NA` (Naples)

#### Phone Number
- **Format**: Italian phone number format
- **Validation**: `/^(\+39\s?)?\d{2,4}\s?\d{3,4}\s?\d{3,4}$/`
- **Example**: `+39 02 1234567` or `02 1234567`

## API Endpoints

### Branch Management

#### Create Branch
```http
POST /api/v1/branches
Content-Type: application/json

{
  "name": "Milan Central",
  "address": "Via Roma 123",
  "city": "Milano",
  "postalCode": "20100",
  "province": "MI",
  "phone": "+39 02 1234567",
  "email": "milan@company.it"
}
```

#### Get All Branches
```http
GET /api/v1/branches
```

#### Get Branch by ID
```http
GET /api/v1/branches/:id
```

#### Get Branch by Branch ID
```http
GET /api/v1/branches/branch-id/BR-001
```

#### Update Branch
```http
PATCH /api/v1/branches/:id
Content-Type: application/json

{
  "name": "Milan Central Updated",
  "phone": "+39 02 7654321"
}
```

#### Delete Branch (Soft Delete)
```http
DELETE /api/v1/branches/:id
```

### Branch Statistics

#### Get Branch Statistics
```http
GET /api/v1/branches/:id/statistics
```

Response:
```json
{
  "success": true,
  "message": "Branch statistics retrieved successfully",
  "data": {
    "branch": {
      "id": "...",
      "branchId": "BR-001",
      "name": "Milan Central",
      "address": "Via Roma 123",
      "city": "Milano",
      "postalCode": "20100",
      "province": "MI",
      "phone": "+39 02 1234567",
      "email": "milan@company.it",
      "isActive": true
    },
    "statistics": {
      "totalEmployees": 15,
      "totalClients": 120,
      "totalInvoices": 450,
      "totalRevenue": 125000.50,
      "pendingInvoices": 25,
      "overdueInvoices": 5
    }
  }
}
```

#### Get All Branches with Statistics
```http
GET /api/v1/branches/statistics/all
```

### ID Generation

#### Generate Employee ID
```http
GET /api/v1/branches/:branchId/generate/employee-id
```

#### Generate Customer ID
```http
GET /api/v1/branches/:branchId/generate/customer-id
```

#### Generate Invoice ID
```http
GET /api/v1/branches/:branchId/generate/invoice-id?year=2024&month=12&date=25
```

## Database Schema

### Branch Table
```sql
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id VARCHAR UNIQUE NOT NULL, -- BR-001, BR-002, etc.
  name VARCHAR NOT NULL,
  address VARCHAR NOT NULL,
  city VARCHAR NOT NULL,
  postal_code VARCHAR NOT NULL, -- 5 digits
  province VARCHAR NOT NULL, -- 2 letters
  phone VARCHAR,
  email VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### User Table (Enhanced)
```sql
ALTER TABLE users ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
```

### Client Table (Enhanced)
```sql
ALTER TABLE clients ADD COLUMN city VARCHAR;
ALTER TABLE clients ADD COLUMN postal_code VARCHAR;
ALTER TABLE clients ADD COLUMN province VARCHAR;
ALTER TABLE clients ADD COLUMN is_active BOOLEAN DEFAULT true;
```

### Invoice Table (Enhanced)
```sql
ALTER TABLE invoices ADD COLUMN issued_date TIMESTAMP DEFAULT NOW();
ALTER TABLE invoices ADD COLUMN notes TEXT;
-- Invoice IDs now include date: INV-BR001-20241225-001
```

## Usage Examples

### Creating a New Branch
```typescript
import { BranchService } from '../services/branch.service';

const branchService = new BranchService();

const newBranch = await branchService.createBranch({
  name: "Rome Office",
  address: "Via del Corso 456",
  city: "Roma",
  postalCode: "00100",
  province: "RM",
  phone: "+39 06 1234567",
  email: "rome@company.it"
});

console.log(newBranch.branchId); // BR-002
```

### Creating an Employee for a Branch
```typescript
import { UserService } from '../services/user.service';
import { BranchService } from '../services/branch.service';

const userService = new UserService();
const branchService = new BranchService();

// Generate employee ID
const employeeId = await branchService.generateEmployeeId(branchId);

// Create user with branch assignment
const employee = await userService.createUser(
  "mario.rossi@company.it",
  "password123",
  "Mario Rossi",
  "EMPLOYEE",
  branchId,
  employeeId
);

console.log(employee.employeeId); // EMP-BR001-001
```

### Creating a Client for a Branch
```typescript
import { ClientService } from '../services/client.service';
import { BranchService } from '../services/branch.service';

const clientService = new ClientService();
const branchService = new BranchService();

// Generate customer ID
const customerId = await branchService.generateCustomerId(branchId);

// Create client with branch assignment
const client = await clientService.createClient(
  "Giuseppe Verdi",
  "giuseppe.verdi@email.it",
  serviceId,
  branchId,
  "+39 333 1234567",
  "Via Garibaldi 789",
  "Milano",
  "20121",
  "MI"
);

console.log(client.customerId); // CUST-BR001-001
```

### Creating an Invoice for a Branch
```typescript
import { InvoiceService } from '../services/invoice.service';
import { BranchService } from '../services/branch.service';

const invoiceService = new InvoiceService();
const branchService = new BranchService();

// Generate invoice ID
const invoiceId = await branchService.generateInvoiceId(branchId, 2024, 12, 25);

// Create invoice with branch assignment
const invoice = await invoiceService.createInvoice({
  clientId: clientId,
  branchId: branchId,
  invoiceNumber: "INV-2024-001",
  dueDate: new Date("2024-12-31"),
  items: [
    {
      serviceId: serviceId,
      quantity: 2,
      price: 100.00
    }
  ],
  notes: "Payment due within 30 days"
});

console.log(invoice.invoiceId); // INV-BR001-20241225-001
```

## Security and Permissions

### Role-Based Access
- **ADMIN**: Full access to all branches and operations
- **HR**: Can manage users within their assigned branch
- **EMPLOYEE**: Limited to their assigned branch

### Branch Isolation
- Users can only access data from their assigned branch
- Clients are automatically linked to the user's branch
- Invoices are created within the user's branch context

## Best Practices

### 1. Branch Creation
- Always validate Italian postal codes and province codes
- Use consistent naming conventions for branches
- Ensure unique branch IDs

### 2. User Management
- Assign users to specific branches during creation
- Generate employee IDs automatically
- Validate branch assignments

### 3. Client Management
- Always link clients to branches
- Use Italian address format
- Generate customer IDs automatically

### 4. Invoice Management
- Ensure invoices are created within the correct branch
- Use year-based invoice ID generation
- Include branch context in all operations

## Error Handling

The system includes comprehensive error handling for:
- Invalid Italian postal codes
- Invalid province codes
- Duplicate IDs
- Non-existent branches
- Unauthorized access to branch data

## Migration Notes

When upgrading from previous versions:
1. Run the database migration: `pnpm prisma migrate dev`
2. Update existing records with proper branch assignments
3. Generate missing IDs for existing records
4. Validate all Italian address data

## Support

For questions or issues with the branch management system, please refer to the API documentation or contact the development team. 