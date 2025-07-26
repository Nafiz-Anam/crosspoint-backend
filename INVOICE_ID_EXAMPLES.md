# Invoice ID System with Date Integration

## 🆔 **New Invoice ID Format**

### **Structure**: `INV-{BranchCode}-{YYYYMMDD}-{Sequence}`

### **Examples**:
- `INV-BR001-20241225-001` - First invoice on December 25, 2024 for branch BR-001
- `INV-BR001-20241225-002` - Second invoice on December 25, 2024 for branch BR-001
- `INV-BR002-20241226-001` - First invoice on December 26, 2024 for branch BR-002
- `INV-BR001-20250101-001` - First invoice on January 1, 2025 for branch BR-001

## 📅 **Date-Based Organization**

### **Benefits**:
1. **📊 Daily Tracking**: Easy to see how many invoices were created each day
2. **📈 Performance Analysis**: Track daily, monthly, and yearly invoice volumes
3. **🔍 Quick Filtering**: Filter invoices by specific dates
4. **📋 Audit Trail**: Clear chronological order of invoice creation
5. **🌍 Multi-Branch Support**: Each branch maintains its own daily sequence

## 🚀 **API Usage**

### **Generate Invoice ID with Current Date**
```http
GET /api/v1/branches/:branchId/generate/invoice-id
```

### **Generate Invoice ID with Specific Date**
```http
GET /api/v1/branches/:branchId/generate/invoice-id?year=2024&month=12&date=25
```

### **Generate Invoice ID with Specific Year Only**
```http
GET /api/v1/branches/:branchId/generate/invoice-id?year=2024
```

## 💻 **Code Examples**

### **TypeScript/JavaScript Usage**

```typescript
import { BranchService } from '../services/branch.service';

const branchService = new BranchService();

// Generate invoice ID for current date
const currentDateInvoiceId = await branchService.generateInvoiceId(branchId);

// Generate invoice ID for specific date
const specificDateInvoiceId = await branchService.generateInvoiceId(
  branchId, 
  2024,    // year
  12,      // month
  25       // date
);

// Generate invoice ID for specific year (uses current month/date)
const specificYearInvoiceId = await branchService.generateInvoiceId(
  branchId, 
  2024     // year only
);
```

### **Creating Invoices with Date-Specific IDs**

```typescript
// Create invoice for Christmas Day 2024
const christmasInvoice = await prisma.invoice.create({
  data: {
    invoiceId: await branchService.generateInvoiceId(branchId, 2024, 12, 25),
    clientId: clientId,
    branchId: branchId,
    invoiceNumber: 'INV-2024-001',
    totalAmount: 1500.00,
    dueDate: new Date('2024-12-31'),
    notes: 'Christmas season services'
  }
});

// Create invoice for New Year's Day 2025
const newYearInvoice = await prisma.invoice.create({
  data: {
    invoiceId: await branchService.generateInvoiceId(branchId, 2025, 1, 1),
    clientId: clientId,
    branchId: branchId,
    invoiceNumber: 'INV-2025-001',
    totalAmount: 2000.00,
    dueDate: new Date('2025-01-31'),
    notes: 'New Year services'
  }
});
```

## 📊 **Real-World Scenarios**

### **Scenario 1: Multiple Invoices on Same Day**
```
Branch BR-001, December 25, 2024:
- INV-BR001-20241225-001 (Morning consultation)
- INV-BR001-20241225-002 (Afternoon project)
- INV-BR001-20241225-003 (Evening support)
```

### **Scenario 2: Multiple Branches on Same Day**
```
December 25, 2024:
- INV-BR001-20241225-001 (Milan branch)
- INV-BR002-20241225-001 (Rome branch)
- INV-BR003-20241225-001 (Naples branch)
```

### **Scenario 3: Year Transition**
```
December 31, 2024:
- INV-BR001-20241231-001 (Last invoice of 2024)

January 1, 2025:
- INV-BR001-20250101-001 (First invoice of 2025)
```

## 🔍 **Querying and Filtering**

### **Find All Invoices for a Specific Date**
```typescript
const december25Invoices = await prisma.invoice.findMany({
  where: {
    invoiceId: {
      contains: '20241225'
    }
  }
});
```

### **Find All Invoices for a Specific Month**
```typescript
const decemberInvoices = await prisma.invoice.findMany({
  where: {
    invoiceId: {
      contains: '202412'
    }
  }
});
```

### **Find All Invoices for a Specific Year**
```typescript
const year2024Invoices = await prisma.invoice.findMany({
  where: {
    invoiceId: {
      contains: '2024'
    }
  }
});
```

### **Find All Invoices for a Branch on a Specific Date**
```typescript
const branchDateInvoices = await prisma.invoice.findMany({
  where: {
    branchId: branchId,
    invoiceId: {
      contains: '20241225'
    }
  }
});
```

## 📈 **Analytics and Reporting**

### **Daily Invoice Count**
```typescript
const dailyStats = await prisma.invoice.groupBy({
  by: ['invoiceId'],
  where: {
    invoiceId: {
      contains: '20241225'
    }
  },
  _count: {
    id: true
  }
});
```

### **Monthly Invoice Count by Branch**
```typescript
const monthlyStats = await prisma.invoice.groupBy({
  by: ['branchId'],
  where: {
    invoiceId: {
      contains: '202412'
    }
  },
  _count: {
    id: true
  }
});
```

## 🛡️ **Validation Rules**

### **Date Validation**
- **Year**: 2020-2030 (configurable)
- **Month**: 1-12
- **Date**: 1-31
- **Sequence**: 001-999 per day per branch

### **Format Validation**
```typescript
// Valid formats
'INV-BR001-20241225-001'  // ✅ Valid
'INV-BR002-20240101-001'  // ✅ Valid
'INV-BR003-20250615-999'  // ✅ Valid

// Invalid formats
'INV-BR001-20241225'      // ❌ Missing sequence
'INV-BR001-20241325-001'  // ❌ Invalid month (13)
'INV-BR001-20241232-001'  // ❌ Invalid date (32)
```

## 🔄 **Migration from Old Format**

### **Old Format**: `INV-BR001-2024-001`
### **New Format**: `INV-BR001-20241225-001`

The system automatically handles the transition. When generating new invoice IDs:
1. Uses current date if no date is specified
2. Maintains backward compatibility
3. Existing invoices remain unchanged

## 🎯 **Best Practices**

1. **📅 Use Specific Dates**: Always specify the date when creating invoices for better organization
2. **🔄 Consistent Formatting**: Always use the full format for consistency
3. **📊 Regular Backups**: Backup invoice data regularly due to increased complexity
4. **🔍 Query Optimization**: Use date-based queries for better performance
5. **📈 Analytics**: Leverage date information for business intelligence

## 🚀 **Future Enhancements**

Potential future improvements:
- **Time-based IDs**: Include hours and minutes for high-volume businesses
- **Seasonal Prefixes**: Add seasonal indicators (Q1, Q2, etc.)
- **Custom Date Formats**: Support for different date formats
- **Batch Processing**: Generate multiple invoice IDs at once
- **Advanced Analytics**: More sophisticated date-based reporting

---

This enhanced invoice ID system provides better organization, tracking, and analytics capabilities for your Italian company's multi-branch operations! 🇮🇹 