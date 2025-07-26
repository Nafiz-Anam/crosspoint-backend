import { PrismaClient, Attendance, AttendanceStatus } from "@prisma/client";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";

const prisma = new PrismaClient();

const checkIn = async (userId: string, notes?: string): Promise<Attendance> => {
  const user = await prisma.user.findUnique({
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
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (existingAttendance && existingAttendance.checkIn) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Already checked in today");
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
        user: {
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
        userId,
        date: today,
        checkIn: now,
        status,
        notes,
      },
      include: {
        user: {
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
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (!attendance) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "No check-in record found for today"
    );
  }

  if (!attendance.checkIn) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Not checked in today");
  }

  if (attendance.checkOut) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Already checked out today");
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
      user: {
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
      userId_date: {
        userId,
        date: targetDate,
      },
    },
    include: {
      user: {
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
      userId,
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { date: "desc" },
    include: {
      user: {
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
      user: {
        branchId,
      },
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: [{ date: "desc" }, { user: { name: "asc" } }],
    include: {
      user: {
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
      user: {
        branchId,
      },
      date: today,
    },
    orderBy: { user: { name: "asc" } },
    include: {
      user: {
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
  const user = await prisma.user.findUnique({
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
      userId_date: {
        userId,
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
        user: {
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
        userId,
        date: targetDate,
        checkIn,
        checkOut,
        totalHours,
        status,
        notes,
      },
      include: {
        user: {
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
      user: {
        branchId,
      },
      date: today,
    },
    include: {
      user: {
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
};
