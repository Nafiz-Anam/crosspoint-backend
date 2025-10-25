import prisma from "../client";
import { TokenType } from "@prisma/client";
import moment from "moment";

interface SessionAnalytics {
  totalSessions: number;
  activeSessions: number;
  terminatedSessions: number;
  averageSessionDuration: number;
  peakConcurrentSessions: number;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
    unknown: number;
  };
  hourlyDistribution: Array<{ hour: number; count: number }>;
  dailyDistribution: Array<{ date: string; count: number }>;
  topIPAddresses: Array<{ ip: string; count: number }>;
  topUserAgents: Array<{ userAgent: string; count: number }>;
  sessionDurationDistribution: Array<{ range: string; count: number }>;
  securityEvents: {
    total: number;
    byType: Array<{ type: string; count: number }>;
    bySeverity: Array<{ severity: string; count: number }>;
  };
}

class SessionAnalyticsService {
  /**
   * Get comprehensive session analytics
   */
  async getSessionAnalytics(
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<SessionAnalytics> {
    const whereClause: any = {
      type: TokenType.REFRESH,
    };

    if (userId) {
      whereClause.employeeId = userId;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Get all sessions
    const sessions = await prisma.token.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate analytics
    const analytics: SessionAnalytics = {
      totalSessions: sessions.length,
      activeSessions: sessions.filter((s) => s.isActive && !s.blacklisted)
        .length,
      terminatedSessions: sessions.filter((s) => !s.isActive || s.blacklisted)
        .length,
      averageSessionDuration: this.calculateAverageSessionDuration(sessions),
      peakConcurrentSessions: await this.calculatePeakConcurrentSessions(
        whereClause
      ),
      deviceBreakdown: this.calculateDeviceBreakdown(sessions),
      hourlyDistribution: this.calculateHourlyDistribution(sessions),
      dailyDistribution: this.calculateDailyDistribution(sessions),
      topIPAddresses: this.calculateTopIPAddresses(sessions),
      topUserAgents: this.calculateTopUserAgents(sessions),
      sessionDurationDistribution:
        this.calculateSessionDurationDistribution(sessions),
      securityEvents: await this.getSecurityEventsAnalytics(
        userId,
        startDate,
        endDate
      ),
    };

    return analytics;
  }

  /**
   * Get user session history
   */
  async getUserSessionHistory(
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    return await prisma.token.findMany({
      where: {
        employeeId: userId,
        type: TokenType.REFRESH,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Get session statistics for dashboard
   */
  async getSessionStats(): Promise<{
    totalActiveSessions: number;
    totalUsers: number;
    sessionsToday: number;
    averageSessionDuration: number;
    topActiveUsers: Array<{ user: any; sessionCount: number }>;
  }> {
    const today = moment().startOf("day").toDate();
    const now = new Date();

    // Get active sessions
    const activeSessions = await prisma.token.findMany({
      where: {
        type: TokenType.REFRESH,
        isActive: true,
        blacklisted: false,
        expires: { gt: now },
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Get sessions created today
    const sessionsToday = await prisma.token.count({
      where: {
        type: TokenType.REFRESH,
        createdAt: { gte: today },
      },
    });

    // Get unique users
    const uniqueUsers = new Set(activeSessions.map((s) => s.employeeId));
    const totalUsers = uniqueUsers.size;

    // Calculate average session duration
    const sessionDurations = activeSessions.map((session) => {
      const created = moment(session.createdAt);
      const now = moment();
      return now.diff(created, "minutes");
    });
    const averageSessionDuration =
      sessionDurations.length > 0
        ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
        : 0;

    // Get top active users
    const userSessionCounts = new Map();
    activeSessions.forEach((session) => {
      const userId = session.employeeId;
      userSessionCounts.set(userId, (userSessionCounts.get(userId) || 0) + 1);
    });

    const topActiveUsers = Array.from(userSessionCounts.entries())
      .map(([userId, count]) => {
        const user = activeSessions.find(
          (s) => s.employeeId === userId
        )?.employee;
        return { user, sessionCount: count };
      })
      .sort((a, b) => b.sessionCount - a.sessionCount)
      .slice(0, 5);

    return {
      totalActiveSessions: activeSessions.length,
      totalUsers,
      sessionsToday,
      averageSessionDuration: Math.round(averageSessionDuration),
      topActiveUsers,
    };
  }

  /**
   * Get security events analytics
   */
  private async getSecurityEventsAnalytics(
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const whereClause: any = {};

    if (userId) {
      whereClause.userId = userId;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const events = await prisma.securityEvent.findMany({
      where: whereClause,
    });

    const byType = new Map();
    const bySeverity = new Map();

    events.forEach((event) => {
      byType.set(event.type, (byType.get(event.type) || 0) + 1);
      bySeverity.set(event.severity, (bySeverity.get(event.severity) || 0) + 1);
    });

    return {
      total: events.length,
      byType: Array.from(byType.entries()).map(([type, count]) => ({
        type,
        count,
      })),
      bySeverity: Array.from(bySeverity.entries()).map(([severity, count]) => ({
        severity,
        count,
      })),
    };
  }

  /**
   * Calculate average session duration
   */
  private calculateAverageSessionDuration(sessions: any[]): number {
    const durations = sessions
      .filter((s) => s.updatedAt && s.createdAt)
      .map((s) => {
        const created = moment(s.createdAt);
        const updated = moment(s.updatedAt);
        return updated.diff(created, "minutes");
      });

    return durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
  }

  /**
   * Calculate peak concurrent sessions
   */
  private async calculatePeakConcurrentSessions(
    whereClause: any
  ): Promise<number> {
    // This is a simplified calculation
    // In a real implementation, you'd need to track session start/end times more precisely
    const sessions = await prisma.token.findMany({
      where: whereClause,
      select: { createdAt: true, updatedAt: true },
    });

    // Group by hour and count concurrent sessions
    const hourlyCounts = new Map();

    sessions.forEach((session) => {
      const hour = moment(session.createdAt).format("YYYY-MM-DD HH");
      hourlyCounts.set(hour, (hourlyCounts.get(hour) || 0) + 1);
    });

    return Math.max(...Array.from(hourlyCounts.values()));
  }

  /**
   * Calculate device breakdown
   */
  private calculateDeviceBreakdown(sessions: any[]): any {
    const breakdown = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };

    sessions.forEach((session) => {
      const userAgent = session.userAgent || "";

      if (
        /Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        )
      ) {
        breakdown.mobile++;
      } else if (/iPad|Android/i.test(userAgent)) {
        breakdown.tablet++;
      } else if (userAgent) {
        breakdown.desktop++;
      } else {
        breakdown.unknown++;
      }
    });

    return breakdown;
  }

  /**
   * Calculate hourly distribution
   */
  private calculateHourlyDistribution(
    sessions: any[]
  ): Array<{ hour: number; count: number }> {
    const hourlyCounts = new Map();

    sessions.forEach((session) => {
      const hour = moment(session.createdAt).hour();
      hourlyCounts.set(hour, (hourlyCounts.get(hour) || 0) + 1);
    });

    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourlyCounts.get(i) || 0,
    }));
  }

  /**
   * Calculate daily distribution
   */
  private calculateDailyDistribution(
    sessions: any[]
  ): Array<{ date: string; count: number }> {
    const dailyCounts = new Map();

    sessions.forEach((session) => {
      const date = moment(session.createdAt).format("YYYY-MM-DD");
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
    });

    return Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate top IP addresses
   */
  private calculateTopIPAddresses(
    sessions: any[]
  ): Array<{ ip: string; count: number }> {
    const ipCounts = new Map();

    sessions.forEach((session) => {
      const ip = session.ipAddress || "Unknown";
      ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
    });

    return Array.from(ipCounts.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Calculate top user agents
   */
  private calculateTopUserAgents(
    sessions: any[]
  ): Array<{ userAgent: string; count: number }> {
    const userAgentCounts = new Map();

    sessions.forEach((session) => {
      const userAgent = session.userAgent || "Unknown";
      userAgentCounts.set(userAgent, (userAgentCounts.get(userAgent) || 0) + 1);
    });

    return Array.from(userAgentCounts.entries())
      .map(([userAgent, count]) => ({ userAgent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Calculate session duration distribution
   */
  private calculateSessionDurationDistribution(
    sessions: any[]
  ): Array<{ range: string; count: number }> {
    const ranges = [
      { label: "0-15 min", min: 0, max: 15 },
      { label: "15-30 min", min: 15, max: 30 },
      { label: "30-60 min", min: 30, max: 60 },
      { label: "1-2 hours", min: 60, max: 120 },
      { label: "2-4 hours", min: 120, max: 240 },
      { label: "4+ hours", min: 240, max: Infinity },
    ];

    const distribution = ranges.map((range) => ({
      range: range.label,
      count: 0,
    }));

    sessions.forEach((session) => {
      if (session.updatedAt && session.createdAt) {
        const duration = moment(session.updatedAt).diff(
          moment(session.createdAt),
          "minutes"
        );

        for (let i = 0; i < ranges.length; i++) {
          if (duration >= ranges[i].min && duration < ranges[i].max) {
            distribution[i].count++;
            break;
          }
        }
      }
    });

    return distribution;
  }

  /**
   * Export session data
   */
  async exportSessionData(
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    const whereClause: any = {
      type: TokenType.REFRESH,
    };

    if (userId) {
      whereClause.employeeId = userId;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    return await prisma.token.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export default new SessionAnalyticsService();
