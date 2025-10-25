import prisma from "../client";
import { TokenType } from "@prisma/client";
import moment from "moment";

interface SecurityEvent {
  type:
    | "LOGIN_ATTEMPT"
    | "SUSPICIOUS_IP"
    | "MULTIPLE_DEVICES"
    | "RAPID_REFRESH"
    | "UNUSUAL_LOCATION";
  userId: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  details: string;
  metadata?: any;
}

class SecurityMonitoringService {
  private suspiciousIPs = new Set<string>();
  private rapidRefreshAttempts = new Map<string, number>();
  private loginAttempts = new Map<
    string,
    { count: number; lastAttempt: Date }
  >();

  /**
   * Log security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Store in database for audit trail
      await prisma.securityEvent.create({
        data: {
          type: event.type,
          userId: event.userId,
          sessionId: event.sessionId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          deviceInfo: event.deviceInfo,
          severity: event.severity,
          details: event.details,
          metadata: event.metadata ? JSON.stringify(event.metadata) : null,
          createdAt: new Date(),
        },
      });

      // Handle critical events immediately
      if (event.severity === "CRITICAL") {
        await this.handleCriticalEvent(event);
      }
    } catch (error) {
      console.error("Error logging security event:", error);
    }
  }

  /**
   * Check for suspicious login patterns
   */
  async checkLoginPatterns(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ isSuspicious: boolean; reason?: string }> {
    const now = new Date();
    const key = `${userId}-${ipAddress}`;

    // Check rapid login attempts
    const attempts = this.loginAttempts.get(key);
    if (attempts) {
      const timeDiff = now.getTime() - attempts.lastAttempt.getTime();
      if (timeDiff < 60000) {
        // Less than 1 minute
        attempts.count++;
        if (attempts.count > 5) {
          await this.logSecurityEvent({
            type: "LOGIN_ATTEMPT",
            userId,
            ipAddress,
            userAgent,
            deviceInfo: "Unknown",
            severity: "HIGH",
            details: `Rapid login attempts detected: ${attempts.count} attempts in 1 minute`,
          });
          return { isSuspicious: true, reason: "Too many login attempts" };
        }
      } else {
        this.loginAttempts.set(key, { count: 1, lastAttempt: now });
      }
    } else {
      this.loginAttempts.set(key, { count: 1, lastAttempt: now });
    }

    // Check for known suspicious IPs
    if (this.suspiciousIPs.has(ipAddress)) {
      await this.logSecurityEvent({
        type: "SUSPICIOUS_IP",
        userId,
        ipAddress,
        userAgent,
        deviceInfo: "Unknown",
        severity: "HIGH",
        details: "Login attempt from known suspicious IP address",
      });
      return { isSuspicious: true, reason: "Suspicious IP address" };
    }

    // Check for unusual user agent patterns
    if (this.isUnusualUserAgent(userAgent)) {
      await this.logSecurityEvent({
        type: "LOGIN_ATTEMPT",
        userId,
        ipAddress,
        userAgent,
        deviceInfo: "Unknown",
        severity: "MEDIUM",
        details: "Unusual user agent pattern detected",
      });
      return { isSuspicious: true, reason: "Unusual device/browser" };
    }

    return { isSuspicious: false };
  }

  /**
   * Check for rapid token refresh attempts
   */
  async checkRapidRefresh(
    userId: string,
    sessionId: string,
    ipAddress: string
  ): Promise<{ isSuspicious: boolean; reason?: string }> {
    const key = `${userId}-${sessionId}`;
    const now = Date.now();

    const attempts = this.rapidRefreshAttempts.get(key) || 0;
    this.rapidRefreshAttempts.set(key, attempts + 1);

    // Reset counter after 5 minutes
    setTimeout(() => {
      this.rapidRefreshAttempts.delete(key);
    }, 5 * 60 * 1000);

    if (attempts > 10) {
      // More than 10 refreshes in 5 minutes
      await this.logSecurityEvent({
        type: "RAPID_REFRESH",
        userId,
        sessionId,
        ipAddress,
        userAgent: "Unknown",
        deviceInfo: "Unknown",
        severity: "MEDIUM",
        details: `Rapid token refresh detected: ${
          attempts + 1
        } refreshes in 5 minutes`,
      });
      return { isSuspicious: true, reason: "Too many token refreshes" };
    }

    return { isSuspicious: false };
  }

  /**
   * Check for multiple device logins
   */
  async checkMultipleDevices(
    userId: string
  ): Promise<{ isSuspicious: boolean; reason?: string }> {
    const activeSessions = await prisma.token.findMany({
      where: {
        employeeId: userId,
        type: TokenType.REFRESH,
        isActive: true,
        blacklisted: false,
        expires: { gt: new Date() },
      },
      select: {
        deviceInfo: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    });

    // Group by device characteristics
    const deviceGroups = new Map();
    activeSessions.forEach((session) => {
      const deviceKey = `${session.deviceInfo}-${session.userAgent}`;
      if (!deviceGroups.has(deviceKey)) {
        deviceGroups.set(deviceKey, []);
      }
      deviceGroups.get(deviceKey).push(session);
    });

    if (deviceGroups.size > 1) {
      await this.logSecurityEvent({
        type: "MULTIPLE_DEVICES",
        userId,
        ipAddress: "Multiple",
        userAgent: "Multiple",
        deviceInfo: "Multiple",
        severity: "LOW",
        details: `User logged in from ${deviceGroups.size} different devices`,
        metadata: { deviceCount: deviceGroups.size },
      });
      return { isSuspicious: true, reason: "Multiple devices detected" };
    }

    return { isSuspicious: false };
  }

  /**
   * Handle critical security events
   */
  private async handleCriticalEvent(event: SecurityEvent): Promise<void> {
    // In a real implementation, you might:
    // - Send email alerts to admins
    // - Send SMS notifications
    // - Trigger additional security measures
    // - Log to external security monitoring systems

    console.error("CRITICAL SECURITY EVENT:", event);

    // For now, just log to console
    // In production, integrate with your alerting system
  }

  /**
   * Check if user agent is unusual
   */
  private isUnusualUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /postman/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(userAgent));
  }

  /**
   * Get security events for a user
   */
  async getUserSecurityEvents(
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    return await prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Get recent security events
   */
  async getRecentSecurityEvents(
    hours: number = 24,
    severity?: string
  ): Promise<any[]> {
    const since = moment().subtract(hours, "hours").toDate();

    return await prisma.securityEvent.findMany({
      where: {
        createdAt: { gte: since },
        ...(severity && { severity }),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  /**
   * Mark IP as suspicious
   */
  markIPSuspicious(ipAddress: string): void {
    this.suspiciousIPs.add(ipAddress);

    // Remove from suspicious list after 24 hours
    setTimeout(() => {
      this.suspiciousIPs.delete(ipAddress);
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Clear old security events
   */
  async cleanupOldEvents(daysToKeep: number = 90): Promise<void> {
    const cutoffDate = moment().subtract(daysToKeep, "days").toDate();

    await prisma.securityEvent.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });
  }
}

export default new SecurityMonitoringService();
