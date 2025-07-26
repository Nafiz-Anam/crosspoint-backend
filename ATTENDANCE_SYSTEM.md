# Employee Attendance System

## Overview

The Employee Attendance System provides comprehensive check-in/check-out functionality with timestamp tracking, attendance status management, and detailed reporting for your Italian company's multi-branch operations.

## Key Features

### 1. **Check-in/Check-out System**
- **Automatic Timestamp Recording**: Precise check-in and check-out times
- **Late Detection**: Automatically detects late arrivals (after 9 AM)
- **Hours Calculation**: Automatic calculation of total hours worked
- **Status Management**: Automatic status updates based on attendance patterns

### 2. **Attendance Status Types**
- **PRESENT**: Normal attendance with full hours
- **LATE**: Arrived after 9 AM
- **HALF_DAY**: Worked less than 4 hours
- **ABSENT**: No attendance record
- **LEAVE**: Official leave day
- **HOLIDAY**: Company holiday

### 3. **Multi-Branch Support**
- **Branch-Specific Tracking**: All attendance records are linked to employee branches
- **Branch Statistics**: Comprehensive attendance analytics per branch
- **Cross-Branch Reporting**: Compare attendance across different branches

## Database Schema

### Attendance Table
```sql
CREATE TABLE attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMP,
  check_out TIMESTAMP,
  total_hours DECIMAL(5,2),
  status attendance_status NOT NULL DEFAULT 'PRESENT',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, date) -- One attendance record per user per day
);
```

### Attendance Status Enum
```sql
CREATE TYPE attendance_status AS ENUM (
  'PRESENT',
  'ABSENT', 
  'LATE',
  'HALF_DAY',
  'LEAVE',
  'HOLIDAY'
);
```

## API Endpoints

### Employee Endpoints (Self-Service)

#### Check-in
```http
POST /api/v1/attendance/check-in
Content-Type: application/json
Authorization: Bearer <token>

{
  "notes": "Optional notes for check-in"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "id": "...",
    "userId": "...",
    "date": "2024-12-25T00:00:00.000Z",
    "checkIn": "2024-12-25T08:30:00.000Z",
    "checkOut": null,
    "totalHours": null,
    "status": "PRESENT",
    "notes": "Optional notes",
    "user": {
      "id": "...",
      "employeeId": "EMP-BR001-001",
      "name": "Mario Rossi",
      "email": "mario.rossi@company.it"
    }
  }
}
```

#### Check-out
```http
POST /api/v1/attendance/check-out
Content-Type: application/json
Authorization: Bearer <token>

{
  "notes": "Optional notes for check-out"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Check-out successful",
  "data": {
    "id": "...",
    "userId": "...",
    "date": "2024-12-25T00:00:00.000Z",
    "checkIn": "2024-12-25T08:30:00.000Z",
    "checkOut": "2024-12-25T17:30:00.000Z",
    "totalHours": 9.0,
    "status": "PRESENT",
    "notes": "Optional notes",
    "user": {
      "id": "...",
      "employeeId": "EMP-BR001-001",
      "name": "Mario Rossi",
      "email": "mario.rossi@company.it"
    }
  }
}
```

#### Get My Attendance (Today)
```http
GET /api/v1/attendance/my-attendance
Authorization: Bearer <token>
```

#### Get My Attendance (Specific Date)
```http
GET /api/v1/attendance/my-attendance?date=2024-12-25
Authorization: Bearer <token>
```

#### Get My Attendance Range
```http
GET /api/v1/attendance/my-attendance/range?startDate=2024-12-01&endDate=2024-12-31
Authorization: Bearer <token>
```

#### Get My Attendance Statistics
```http
GET /api/v1/attendance/my-attendance/stats?startDate=2024-12-01&endDate=2024-12-31
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance statistics retrieved successfully",
  "data": {
    "totalDays": 22,
    "presentDays": 20,
    "absentDays": 1,
    "lateDays": 1,
    "halfDays": 0,
    "totalHours": 176.5,
    "averageHoursPerDay": 8.02
  }
}
```

### HR/Admin Endpoints

#### Get Branch Attendance
```http
GET /api/v1/attendance/branch/:branchId?startDate=2024-12-01&endDate=2024-12-31
Authorization: Bearer <token>
```

#### Get Today's Branch Attendance
```http
GET /api/v1/attendance/branch/:branchId/today
Authorization: Bearer <token>
```

#### Get Branch Attendance Statistics
```http
GET /api/v1/attendance/branch/:branchId/stats?date=2024-12-25
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Branch attendance statistics retrieved successfully",
  "data": {
    "totalEmployees": 15,
    "presentEmployees": 12,
    "absentEmployees": 2,
    "lateEmployees": 1,
    "averageHours": 7.8
  }
}
```

#### Mark Attendance Manually
```http
POST /api/v1/attendance/user/:userId
Content-Type: application/json
Authorization: Bearer <token>

{
  "date": "2024-12-25",
  "status": "PRESENT",
  "checkIn": "2024-12-25T08:30:00.000Z",
  "checkOut": "2024-12-25T17:30:00.000Z",
  "notes": "Manual attendance entry"
}
```

#### Get User Attendance
```http
GET /api/v1/attendance/user/:userId?date=2024-12-25
Authorization: Bearer <token>
```

#### Get User Attendance Range
```http
GET /api/v1/attendance/user/:userId/range?startDate=2024-12-01&endDate=2024-12-31
Authorization: Bearer <token>
```

#### Get User Attendance Statistics
```http
GET /api/v1/attendance/user/:userId/stats?startDate=2024-12-01&endDate=2024-12-31
Authorization: Bearer <token>
```

## Usage Examples

### Employee Self-Service

```typescript
import { AttendanceService } from '../services/attendance.service';

const attendanceService = new AttendanceService();

// Employee checks in
const checkInResult = await attendanceService.checkIn(userId, "Arrived on time");

// Employee checks out
const checkOutResult = await attendanceService.checkOut(userId, "Completed daily tasks");

// Get today's attendance
const todayAttendance = await attendanceService.getAttendanceByDate(userId, new Date());

// Get attendance statistics for the month
const stats = await attendanceService.getUserAttendanceStats(
  userId,
  new Date('2024-12-01'),
  new Date('2024-12-31')
);
```

### HR/Admin Management

```typescript
// Get all attendance for a branch
const branchAttendance = await attendanceService.getBranchAttendanceByDateRange(
  branchId,
  new Date('2024-12-01'),
  new Date('2024-12-31')
);

// Get today's attendance for a branch
const todayBranchAttendance = await attendanceService.getTodayAttendanceByBranch(branchId);

// Mark attendance manually for an employee
const manualAttendance = await attendanceService.markAttendance(
  userId,
  new Date('2024-12-25'),
  'PRESENT',
  new Date('2024-12-25T08:30:00.000Z'),
  new Date('2024-12-25T17:30:00.000Z'),
  'Manual entry'
);

// Get branch statistics
const branchStats = await attendanceService.getBranchAttendanceStats(branchId, new Date());
```

## Business Logic

### Check-in Logic
1. **Validation**: Ensures user exists and is active
2. **Duplicate Prevention**: Prevents multiple check-ins on the same day
3. **Late Detection**: Automatically marks as LATE if after 9 AM
4. **Status Assignment**: Sets appropriate status based on check-in time

### Check-out Logic
1. **Validation**: Ensures user has checked in for the day
2. **Hours Calculation**: Calculates total hours worked
3. **Status Update**: Updates status based on hours worked
4. **Half-day Detection**: Marks as HALF_DAY if less than 4 hours

### Status Management
- **PRESENT**: Normal attendance (8+ hours)
- **LATE**: Arrived after 9 AM
- **HALF_DAY**: Worked less than 4 hours
- **ABSENT**: No attendance record
- **LEAVE**: Official leave (manual entry)
- **HOLIDAY**: Company holiday (manual entry)

## Reporting and Analytics

### Individual Employee Reports
- Daily attendance records
- Monthly attendance summaries
- Hours worked statistics
- Attendance patterns analysis

### Branch Reports
- Daily branch attendance overview
- Employee attendance comparison
- Branch performance metrics
- Attendance trends analysis

### Company-wide Reports
- Cross-branch attendance comparison
- Overall attendance statistics
- Performance benchmarking
- Compliance reporting

## Security and Permissions

### Role-Based Access
- **EMPLOYEE**: Can only access their own attendance
- **HR**: Can manage attendance for their branch
- **ADMIN**: Can manage attendance across all branches

### Data Protection
- Attendance records are linked to specific branches
- Users can only access data from their assigned branch
- Audit trail for all attendance modifications

## Best Practices

### For Employees
1. **Regular Check-ins**: Check in at the start of each workday
2. **Timely Check-outs**: Check out when leaving for the day
3. **Note Taking**: Add relevant notes for special circumstances
4. **Review Records**: Regularly review your attendance history

### For HR/Admin
1. **Monitor Patterns**: Watch for attendance patterns and trends
2. **Address Issues**: Proactively address attendance problems
3. **Maintain Records**: Keep accurate manual attendance records
4. **Generate Reports**: Regular reporting for management review

### For Management
1. **Set Policies**: Establish clear attendance policies
2. **Review Reports**: Regular review of attendance analytics
3. **Address Trends**: Address attendance trends across branches
4. **Compliance**: Ensure compliance with labor laws

## Error Handling

The system includes comprehensive error handling for:
- **Duplicate Check-ins**: Prevents multiple check-ins per day
- **Missing Check-ins**: Validates check-in before check-out
- **Invalid Dates**: Validates date formats and ranges
- **User Permissions**: Ensures proper access control
- **Data Validation**: Validates all input data

## Integration with Branch System

The attendance system is fully integrated with the branch management system:
- All attendance records are linked to employee branches
- Branch-specific reporting and analytics
- Cross-branch attendance comparison
- Branch performance metrics

## Future Enhancements

Potential future improvements:
- **Geolocation Tracking**: Location-based check-ins
- **Biometric Integration**: Fingerprint/face recognition
- **Mobile App**: Dedicated mobile attendance app
- **Real-time Notifications**: Attendance alerts and reminders
- **Advanced Analytics**: Machine learning for attendance patterns
- **Leave Management**: Integrated leave request system
- **Overtime Tracking**: Automatic overtime calculation
- **Shift Management**: Support for multiple shifts

---

This comprehensive attendance system provides robust tracking, reporting, and management capabilities for your Italian company's multi-branch operations! 🇮🇹 