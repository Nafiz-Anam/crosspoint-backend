import { PrismaClient, Attendance, AttendanceStatus } from "@prisma/client";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import { getItalianToday, ITALY_TIMEZONE } from "../utils/timezone";

const prisma = new PrismaClient();

const checkIn = async (userId: string, notes?: string): Promise<Attendance> => {
  const user = await prisma.employee.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (!user.isActive) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User is not active");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if attendance record already exists for today
  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: userId,
        date: today,
      },
    },
  });

  if (existingAttendance && existingAttendance.checkIn) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "*Hai già timbrato oggi*");
  }

  const now = new Date();
  let status: AttendanceStatus = AttendanceStatus.PRESENT;

  // Check if late (assuming work starts at 9 AM)
  const workStartTime = new Date(today);
  workStartTime.setHours(9, 0, 0, 0);

  if (now > workStartTime) {
    status = AttendanceStatus.LATE;
  }

  if (existingAttendance) {
    // Update existing record
    const updatedAttendance = await prisma.attendance.update({
      where: { id: existingAttendance.id },
      data: {
        checkIn: now,
        status,
        notes: notes || existingAttendance.notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updatedAttendance;
  } else {
    // Create new attendance record
    const newAttendance = await prisma.attendance.create({
      data: {
        employeeId: userId,
        date: today,
        checkIn: now,
        status,
        notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return newAttendance;
  }
};

const checkOut = async (
  userId: string,
  notes?: string
): Promise<Attendance> => {
  const user = await prisma.employee.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: userId,
        date: today,
      },
    },
  });

  if (!attendance) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "*Nessun record di timbratura trovato per oggi*"
    );
  }

  if (!attendance.checkIn) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "*Non hai timbrato in entrata oggi*"
    );
  }

  if (attendance.checkOut) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "*Hai già timbrato in uscita oggi*"
    );
  }

  const now = new Date();
  const checkInTime = attendance.checkIn;
  const totalHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60); // Convert to hours

  // Update status based on hours worked
  let status = attendance.status;
  if (totalHours < 4) {
    status = AttendanceStatus.HALF_DAY;
  }

  const updatedAttendance = await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOut: now,
      totalHours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
      status,
      notes: notes || attendance.notes,
    },
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return updatedAttendance;
};

const getAttendanceByDate = async (
  userId: string,
  date: Date
): Promise<Attendance | null> => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  return prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: userId,
        date: targetDate,
      },
    },
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

const getAttendanceByDateRange = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Attendance[]> => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return prisma.attendance.findMany({
    where: {
      employeeId: userId,
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { date: "desc" },
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

const getBranchAttendanceByDateRange = async (
  branchId: string,
  startDate: Date,
  endDate: Date
): Promise<Attendance[]> => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return prisma.attendance.findMany({
    where: {
      employee: {
        branchId,
      },
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: [{ date: "desc" }, { employee: { name: "asc" } }],
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          name: true,
          email: true,
          branch: {
            select: {
              id: true,
              branchId: true,
              name: true,
            },
          },
        },
      },
    },
  });
};

const getTodayAttendanceByBranch = async (
  branchId: string
): Promise<Attendance[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.attendance.findMany({
    where: {
      employee: {
        branchId,
      },
      date: today,
    },
    orderBy: { employee: { name: "asc" } },
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          name: true,
          email: true,
          branch: {
            select: {
              id: true,
              branchId: true,
              name: true,
            },
          },
        },
      },
    },
  });
};

const markAttendance = async (
  userId: string,
  date: Date,
  status: AttendanceStatus,
  checkIn?: Date,
  checkOut?: Date,
  notes?: string
): Promise<Attendance> => {
  const user = await prisma.employee.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Calculate total hours if both check-in and check-out are provided
  let totalHours: number | undefined;
  if (checkIn && checkOut) {
    totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    totalHours = Math.round(totalHours * 100) / 100;
  }

  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: userId,
        date: targetDate,
      },
    },
  });

  if (existingAttendance) {
    // Update existing record
    return prisma.attendance.update({
      where: { id: existingAttendance.id },
      data: {
        checkIn,
        checkOut,
        totalHours,
        status,
        notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
          },
        },
      },
    });
  } else {
    // Create new record
    return prisma.attendance.create({
      data: {
        employeeId: userId,
        date: targetDate,
        checkIn,
        checkOut,
        totalHours,
        status,
        notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
};

const getUserAttendanceStats = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  totalHours: number;
  averageHoursPerDay: number;
}> => {
  const attendances = await getAttendanceByDateRange(
    userId,
    startDate,
    endDate
  );

  const totalDays = attendances.length;
  const presentDays = attendances.filter(
    (a) => a.status === AttendanceStatus.PRESENT
  ).length;
  const absentDays = attendances.filter(
    (a) => a.status === AttendanceStatus.ABSENT
  ).length;
  const lateDays = attendances.filter(
    (a) => a.status === AttendanceStatus.LATE
  ).length;
  const halfDays = attendances.filter(
    (a) => a.status === AttendanceStatus.HALF_DAY
  ).length;

  const totalHours = attendances.reduce(
    (sum, a) => sum + (a.totalHours || 0),
    0
  );
  const averageHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;

  return {
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    halfDays,
    totalHours: Math.round(totalHours * 100) / 100,
    averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100,
  };
};

const getBranchAttendanceStats = async (
  branchId: string,
  date: Date
): Promise<{
  totalEmployees: number;
  presentEmployees: number;
  absentEmployees: number;
  lateEmployees: number;
  averageHours: number;
}> => {
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);

  const attendances = await prisma.attendance.findMany({
    where: {
      employee: {
        branchId,
      },
      date: today,
    },
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          name: true,
        },
      },
    },
  });

  const totalEmployees = attendances.length;
  const presentEmployees = attendances.filter(
    (a) => a.status === AttendanceStatus.PRESENT
  ).length;
  const absentEmployees = attendances.filter(
    (a) => a.status === AttendanceStatus.ABSENT
  ).length;
  const lateEmployees = attendances.filter(
    (a) => a.status === AttendanceStatus.LATE
  ).length;

  const totalHours = attendances.reduce(
    (sum, a) => sum + (a.totalHours || 0),
    0
  );
  const averageHours = totalEmployees > 0 ? totalHours / totalEmployees : 0;

  return {
    totalEmployees,
    presentEmployees,
    absentEmployees,
    lateEmployees,
    averageHours: Math.round(averageHours * 100) / 100,
  };
};

const generateAttendanceReport = async (
  employeeId: string,
  reportType: string,
  startDate?: Date,
  endDate?: Date
): Promise<Buffer> => {
  const XLSX = require("xlsx");

  // Get employee details
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      branch: {
        select: {
          name: true,
          city: true,
        },
      },
    },
  });

  if (!employee) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");
  }

  // Calculate date range based on report type
  let reportStartDate: Date;
  let reportEndDate: Date;

  const now = new Date();

  switch (reportType) {
    case "currentMonth":
      reportStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      reportEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case "previousMonth":
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      reportStartDate = new Date(
        prevMonth.getFullYear(),
        prevMonth.getMonth(),
        1
      );
      reportEndDate = new Date(
        prevMonth.getFullYear(),
        prevMonth.getMonth() + 1,
        0
      );
      break;
    case "specificMonth":
    case "customRange":
      if (!startDate || !endDate) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Start date and end date are required"
        );
      }
      reportStartDate = startDate;
      reportEndDate = endDate;
      break;
    default:
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid report type");
  }

  // Get attendance data for the period
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      employeeId: employeeId,
      date: {
        gte: reportStartDate,
        lte: reportEndDate,
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // Prepare data for Excel
  const excelData = [];

  // Add employee information header
  excelData.push(["EMPLOYEE ATTENDANCE REPORT"]);
  excelData.push([]);
  excelData.push(["Employee Information"]);
  excelData.push(["Name:", employee.name || "N/A"]);
  excelData.push(["Employee ID:", employee.employeeId || "N/A"]);
  excelData.push(["Email:", employee.email]);
  excelData.push(["Branch:", employee.branch?.name || "N/A"]);
  excelData.push(["City:", employee.branch?.city || "N/A"]);
  excelData.push([
    "Report Period:",
    `${reportStartDate.toLocaleDateString()} - ${reportEndDate.toLocaleDateString()}`,
  ]);
  excelData.push(["Generated On:", new Date().toLocaleString()]);
  excelData.push([]);

  // Add attendance data headers
  excelData.push([
    "Date",
    "Day",
    "Check In",
    "Check Out",
    "Total Hours",
    "Status",
    "Notes",
  ]);

  // Add attendance records
  attendanceRecords.forEach((record) => {
    const checkInTime = record.checkIn
      ? record.checkIn.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "N/A";

    const checkOutTime = record.checkOut
      ? record.checkOut.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "N/A";

    const totalHours = record.totalHours
      ? `${record.totalHours.toFixed(2)} hrs`
      : "N/A";

    const dayName = record.date.toLocaleDateString("en-US", {
      weekday: "long",
    });

    excelData.push([
      record.date.toLocaleDateString(),
      dayName,
      checkInTime,
      checkOutTime,
      totalHours,
      record.status,
      record.notes || "N/A",
    ]);
  });

  // Add summary
  excelData.push([]);
  excelData.push(["SUMMARY"]);
  excelData.push(["Total Working Days:", attendanceRecords.length]);
  excelData.push([
    "Total Hours Worked:",
    attendanceRecords
      .reduce((sum, record) => sum + (record.totalHours || 0), 0)
      .toFixed(2),
  ]);

  const presentDays = attendanceRecords.filter(
    (record) => record.status === "PRESENT"
  ).length;
  const lateDays = attendanceRecords.filter(
    (record) => record.status === "LATE"
  ).length;
  const halfDays = attendanceRecords.filter(
    (record) => record.status === "HALF_DAY"
  ).length;
  const absentDays = attendanceRecords.filter(
    (record) => record.status === "ABSENT"
  ).length;

  excelData.push(["Present Days:", presentDays]);
  excelData.push(["Late Days:", lateDays]);
  excelData.push(["Half Days:", halfDays]);
  excelData.push(["Absent Days:", absentDays]);

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  // Set column widths
  const columnWidths = [
    { wch: 12 }, // Date
    { wch: 12 }, // Day
    { wch: 12 }, // Check In
    { wch: 12 }, // Check Out
    { wch: 12 }, // Total Hours
    { wch: 12 }, // Status
    { wch: 30 }, // Notes
  ];
  worksheet["!cols"] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");

  // Generate Excel file buffer
  const excelBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return excelBuffer;
};

const getAttendanceReportData = async (
  employeeId: string,
  reportType: string,
  startDate?: Date,
  endDate?: Date
): Promise<any> => {
  // Get employee details
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      branch: {
        select: {
          name: true,
          city: true,
        },
      },
    },
  });

  if (!employee) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");
  }

  // Calculate date range based on report type
  let reportStartDate: Date;
  let reportEndDate: Date;

  const now = new Date();

  switch (reportType) {
    case "currentMonth":
      reportStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      reportEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case "previousMonth":
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      reportStartDate = new Date(
        prevMonth.getFullYear(),
        prevMonth.getMonth(),
        1
      );
      reportEndDate = new Date(
        prevMonth.getFullYear(),
        prevMonth.getMonth() + 1,
        0
      );
      break;
    case "specificMonth":
    case "customRange":
      if (!startDate || !endDate) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Start date and end date are required"
        );
      }
      reportStartDate = startDate;
      reportEndDate = endDate;
      break;
    default:
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid report type");
  }

  // Get attendance data for the period
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      employeeId: employeeId,
      date: {
        gte: reportStartDate,
        lte: reportEndDate,
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // Calculate summary statistics
  const totalWorkingDays = attendanceRecords.length;
  const totalHoursWorked = attendanceRecords.reduce(
    (sum, record) => sum + (record.totalHours || 0),
    0
  );
  const presentDays = attendanceRecords.filter(
    (record) => record.status === "PRESENT"
  ).length;
  const lateDays = attendanceRecords.filter(
    (record) => record.status === "LATE"
  ).length;
  const halfDays = attendanceRecords.filter(
    (record) => record.status === "HALF_DAY"
  ).length;
  const absentDays = attendanceRecords.filter(
    (record) => record.status === "ABSENT"
  ).length;

  return {
    employee: {
      id: employee.id,
      name: employee.name,
      employeeId: employee.employeeId,
      email: employee.email,
      branch: employee.branch?.name,
      city: employee.branch?.city,
    },
    reportPeriod: {
      startDate: reportStartDate,
      endDate: reportEndDate,
      type: reportType,
    },
    attendanceRecords: attendanceRecords.map((record) => ({
      date: record.date,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      totalHours: record.totalHours,
      status: record.status,
      notes: record.notes,
    })),
    summary: {
      totalWorkingDays,
      totalHoursWorked: parseFloat(totalHoursWorked.toFixed(2)),
      presentDays,
      lateDays,
      halfDays,
      absentDays,
    },
  };
};

export default {
  checkIn,
  checkOut,
  getAttendanceByDate,
  getAttendanceByDateRange,
  getBranchAttendanceByDateRange,
  getTodayAttendanceByBranch,
  markAttendance,
  getUserAttendanceStats,
  getBranchAttendanceStats,
  generateAttendanceReport,
  getAttendanceReportData,
};
