import cron from "node-cron";
import { InvoiceStatus, TaskStatus, AttendanceStatus } from "@prisma/client";
import prisma from "../client";
import logger from "../config/logger";
import emailService from "./email.service";

/**
 * Check for overdue invoices and update their status
 * This function runs daily to mark invoices as overdue when due date has passed
 */
const checkOverdueInvoices = async () => {
  try {
    logger.info("Starting overdue invoice check...");

    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    // Find all unpaid invoices where due date has passed
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.UNPAID,
        dueDate: {
          lt: today,
        },
      },
      include: {
        client: {
          include: {
            branch: true,
          },
        },
        employee: true,
        branch: true,
        items: {
          include: {
            service: true,
          },
        },
      },
    });

    logger.info(`Found ${overdueInvoices.length} overdue invoices`);

    if (overdueInvoices.length === 0) {
      logger.info("No overdue invoices found");
      return;
    }

    // Update status to OVERDUE for all found invoices
    const updatePromises = overdueInvoices.map((invoice) =>
      prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.OVERDUE },
      })
    );

    await Promise.all(updatePromises);
    logger.info(`Updated ${overdueInvoices.length} invoices to OVERDUE status`);

    // Send email notifications for each overdue invoice
    for (const invoice of overdueInvoices) {
      await sendOverdueNotification(invoice);
    }

    logger.info("Overdue invoice check completed successfully");
  } catch (error) {
    logger.error("Error checking overdue invoices:", error);
  }
};

/**
 * Send overdue notification email to client and admins/managers
 * @param {Object} invoice - Invoice with related data
 */
const sendOverdueNotification = async (invoice: any) => {
  try {
    // Get all admins and managers
    const adminsAndManagers = await prisma.employee.findMany({
      where: {
        OR: [{ role: "ADMIN" }, { role: "MANAGER" }],
      },
      select: {
        email: true,
        name: true,
      },
    });

    // Prepare email content
    const clientName = invoice.client.name;
    const invoiceNumber = invoice.invoiceNumber;
    const dueDate = new Date(invoice.dueDate).toLocaleDateString();
    const totalAmount = invoice.totalAmount;
    const branchName = invoice.branch.name;

    const subject = `Invoice Overdue: ${invoiceNumber} - ${clientName}`;

    const clientEmailText = `
Dear ${clientName},

This is to inform you that your invoice ${invoiceNumber} is now overdue.

Invoice Details:
- Invoice Number: ${invoiceNumber}
- Due Date: ${dueDate}
- Total Amount: $${totalAmount.toFixed(2)}
- Branch: ${branchName}

Please make payment as soon as possible to avoid any additional charges.

If you have already made payment, please contact us immediately.

Thank you for your attention to this matter.

Best regards,
${invoice.branch.name} Team
    `;

    const adminEmailText = `
Invoice Overdue Alert

An invoice has been automatically marked as overdue:

Client: ${clientName}
Invoice Number: ${invoiceNumber}
Due Date: ${dueDate}
Total Amount: $${totalAmount.toFixed(2)}
Branch: ${branchName}
Assigned Employee: ${invoice.employee.name}

Please follow up with the client regarding payment.

Invoice Details:
${invoice.items
  .map(
    (item: any) =>
      `- ${item.service.name}: $${item.rate.toFixed(2)} (${item.description})`
  )
  .join("\n")}

Notes: ${invoice.notes || "No additional notes"}

This is an automated notification from the Crosspoint system.
    `;

    // Send email to client
    if (invoice.client.email) {
      await emailService.sendEmail(
        invoice.client.email,
        subject,
        clientEmailText
      );
      logger.info(
        `Overdue notification sent to client: ${invoice.client.email}`
      );
    }

    // Send email to all admins and managers
    const adminEmails = adminsAndManagers
      .filter((admin) => admin.email)
      .map((admin) => admin.email);

    if (adminEmails.length > 0) {
      const adminSubject = `[OVERDUE ALERT] ${subject}`;

      await Promise.all(
        adminEmails.map((email) =>
          emailService.sendEmail(email, adminSubject, adminEmailText)
        )
      );

      logger.info(
        `Overdue notifications sent to ${adminEmails.length} admins/managers`
      );
    }
  } catch (error) {
    logger.error(
      `Error sending overdue notification for invoice ${invoice.id}:`,
      error
    );
  }
};

/**
 * Check for tasks approaching deadline and send notifications
 * This function runs every 6 hours to check for tasks due in 48h and 24h
 */
const checkTaskDeadlines = async () => {
  try {
    logger.info("Starting task deadline check...");

    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Find tasks due in 48 hours (between 48h and 49h from now)
    const tasks48Hours = await prisma.task.findMany({
      where: {
        status: {
          in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
        },
        dueDate: {
          gte: in48Hours,
          lt: in25Hours,
        },
      },
      include: {
        client: {
          include: {
            branch: true,
          },
        },
        service: true,
        assignedEmployee: true,
      },
    });

    // Find tasks due in 24 hours (between 24h and 25h from now)
    const tasks24Hours = await prisma.task.findMany({
      where: {
        status: {
          in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
        },
        dueDate: {
          gte: in24Hours,
          lt: in25Hours,
        },
      },
      include: {
        client: {
          include: {
            branch: true,
          },
        },
        service: true,
        assignedEmployee: true,
      },
    });

    logger.info(`Found ${tasks48Hours.length} tasks due in 48 hours`);
    logger.info(`Found ${tasks24Hours.length} tasks due in 24 hours`);

    // Send 48-hour notifications
    for (const task of tasks48Hours) {
      await sendTaskDeadlineNotification(task, 48);
    }

    // Send 24-hour notifications
    for (const task of tasks24Hours) {
      await sendTaskDeadlineNotification(task, 24);
    }

    logger.info("Task deadline check completed successfully");
  } catch (error) {
    logger.error("Error checking task deadlines:", error);
  }
};

/**
 * Send task deadline notification to assigned employee and branch managers
 * @param {Object} task - Task with related data
 * @param {number} hoursRemaining - Hours remaining until deadline
 */
const sendTaskDeadlineNotification = async (
  task: any,
  hoursRemaining: number
) => {
  try {
    // Get branch managers for the task's branch
    const branchManagers = await prisma.employee.findMany({
      where: {
        branchId: task.client.branchId,
        role: "MANAGER",
      },
      select: {
        email: true,
        name: true,
      },
    });

    // Prepare email content
    const taskTitle = task.title;
    const clientName = task.client.name;
    const serviceName = task.service.name;
    const assignedEmployeeName = task.assignedEmployee.name;
    const dueDate = new Date(task.dueDate).toLocaleDateString();
    const dueTime = new Date(task.dueDate).toLocaleTimeString();
    const branchName = task.client.branch.name;

    const subject = `Task Deadline Alert: ${taskTitle} - ${hoursRemaining}h remaining`;

    const employeeEmailText = `
Dear ${assignedEmployeeName},

This is a reminder that your task "${taskTitle}" is due in ${hoursRemaining} hours.

Task Details:
- Task: ${taskTitle}
- Client: ${clientName}
- Service: ${serviceName}
- Due Date: ${dueDate} at ${dueTime}
- Branch: ${branchName}
- Status: ${task.status}

Please ensure you complete this task on time or update the status if needed.

Best regards,
${branchName} Management
    `;

    const managerEmailText = `
Task Deadline Alert - ${hoursRemaining} Hours Remaining

A task assigned to one of your team members is approaching its deadline:

Task: ${taskTitle}
Assigned Employee: ${assignedEmployeeName}
Client: ${clientName}
Service: ${serviceName}
Due Date: ${dueDate} at ${dueTime}
Status: ${task.status}
Description: ${task.description || "No description provided"}

Please follow up with the assigned employee to ensure timely completion.

This is an automated notification from the Crosspoint system.
    `;

    // Send email to assigned employee
    if (task.assignedEmployee.email) {
      await emailService.sendEmail(
        task.assignedEmployee.email,
        subject,
        employeeEmailText
      );
      logger.info(
        `Task deadline notification sent to employee: ${task.assignedEmployee.email}`
      );
    }

    // Send email to branch managers
    const managerEmails = branchManagers
      .filter((manager) => manager.email)
      .map((manager) => manager.email);

    if (managerEmails.length > 0) {
      const managerSubject = `[TASK ALERT] ${subject}`;

      await Promise.all(
        managerEmails.map((email) =>
          emailService.sendEmail(email, managerSubject, managerEmailText)
        )
      );

      logger.info(
        `Task deadline notifications sent to ${managerEmails.length} branch managers`
      );
    }
  } catch (error) {
    logger.error(
      `Error sending task deadline notification for task ${task.id}:`,
      error
    );
  }
};

/**
 * Auto clockout for employees who forgot to clock out
 * This function runs daily at 9:00 PM Italian time to automatically clock out employees
 */
const autoClockOut = async () => {
  try {
    logger.info("Starting auto clockout check...");

    // Get today's date in Italian timezone
    const now = new Date();
    const today = new Date(
      now.toLocaleString("en-US", { timeZone: "Europe/Rome" })
    );
    today.setHours(0, 0, 0, 0);

    // Find all employees who clocked in today but haven't clocked out
    const incompleteAttendances = await prisma.attendance.findMany({
      where: {
        date: today,
        checkIn: { not: null },
        checkOut: null,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          },
        },
      },
    });

    logger.info(
      `Found ${incompleteAttendances.length} employees who forgot to clock out`
    );

    if (incompleteAttendances.length === 0) {
      logger.info("No employees need auto clockout");
      return;
    }

    // Auto clockout each employee
    for (const attendance of incompleteAttendances) {
      const now = new Date();
      const checkInTime = attendance.checkIn!;
      const totalHours =
        (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60); // Convert to hours

      // Update status based on hours worked
      let status = attendance.status;
      if (totalHours < 4) {
        status = AttendanceStatus.HALF_DAY;
      }

      // Update attendance record with clockout time
      await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: now,
          totalHours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
          status,
          notes: attendance.notes
            ? `${attendance.notes}\n[Auto clocked out at 9 PM]`
            : "[Auto clocked out at 9 PM]",
        },
      });

      logger.info(
        `Auto clocked out employee: ${attendance.employee.name} (${attendance.employee.employeeId})`
      );

      // Send notification email to employee
      if (attendance.employee.email) {
        await sendAutoClockOutNotification(
          attendance.employee,
          now,
          totalHours
        );
      }
    }

    logger.info("Auto clockout completed successfully");
  } catch (error) {
    logger.error("Error during auto clockout:", error);
  }
};

/**
 * Send auto clockout notification to employee
 * @param {Object} employee - Employee who was auto clocked out
 * @param {Date} clockOutTime - Time when auto clockout occurred
 * @param {number} totalHours - Total hours worked
 */
const sendAutoClockOutNotification = async (
  employee: any,
  clockOutTime: Date,
  totalHours: number
) => {
  try {
    const employeeName = employee.name || "Employee";
    const employeeId = employee.employeeId || "N/A";
    const formattedTime = clockOutTime.toLocaleString("it-IT", {
      timeZone: "Europe/Rome",
      dateStyle: "long",
      timeStyle: "short",
    });

    const subject = "⏰ Auto Timbratura Uscita - Auto Clock Out";

    const emailText = `
Caro/a ${employeeName},

Ti informiamo che è stata eseguita automaticamente la timbratura di uscita alle 21:00 (ora italiana) in quanto non avevi effettuato manualmente la timbratura oggi.

Dettagli:
- Nome: ${employeeName}
- ID Dipendente: ${employeeId}
- Orario Auto Uscita: ${formattedTime}
- Ore Lavorate: ${totalHours.toFixed(2)} ore

Nota: Si prega di ricordarsi di timbrare manualmente l'uscita alla fine della giornata lavorativa.

Se pensi che ci sia un errore o se hai domande, ti preghiamo di contattare l'amministrazione.

Cordiali saluti,
Sistema Crosspoint
---

Dear ${employeeName},

We would like to inform you that an automatic clock out was performed at 9:00 PM (Italian time) as you had not manually clocked out today.

Details:
- Name: ${employeeName}
- Employee ID: ${employeeId}
- Auto Clock Out Time: ${formattedTime}
- Hours Worked: ${totalHours.toFixed(2)} hours

Note: Please remember to manually clock out at the end of your workday.

If you think there is an error or have any questions, please contact administration.

Best regards,
Crosspoint System
    `;

    await emailService.sendEmail(employee.email, subject, emailText);
    logger.info(`Auto clockout notification sent to: ${employee.email}`);
  } catch (error) {
    logger.error(
      `Error sending auto clockout notification to ${employee.email}:`,
      error
    );
  }
};

/**
 * Check for employee birthdays and send notifications
 * This function runs daily at 9:00 AM to check for birthdays
 */
const checkEmployeeBirthdays = async () => {
  try {
    logger.info("Starting employee birthday check...");

    const today = new Date();
    const todayMonth = today.getMonth() + 1; // getMonth() returns 0-11
    const todayDay = today.getDate();

    // Find employees whose birthday is today
    const birthdayEmployees = await prisma.employee.findMany({
      where: {
        isActive: true,
        // Using raw SQL for date comparison since Prisma doesn't have built-in date functions
        // We'll use a more complex approach with date extraction
      },
      include: {
        branch: true,
      },
    });

    // Filter employees whose birthday is today using JavaScript
    const todayBirthdayEmployees = birthdayEmployees.filter((employee) => {
      const birthDate = new Date(employee.dateOfBirth);
      return (
        birthDate.getMonth() + 1 === todayMonth &&
        birthDate.getDate() === todayDay
      );
    });

    logger.info(
      `Found ${todayBirthdayEmployees.length} employees with birthdays today`
    );

    if (todayBirthdayEmployees.length === 0) {
      logger.info("No birthdays found today");
      return;
    }

    // Send birthday notifications
    for (const employee of todayBirthdayEmployees) {
      await sendBirthdayNotifications(employee);
    }

    logger.info("Employee birthday check completed successfully");
  } catch (error) {
    logger.error("Error checking employee birthdays:", error);
  }
};

/**
 * Send birthday notifications to the birthday employee and all other employees
 * @param {Object} birthdayEmployee - Employee whose birthday it is
 */
const sendBirthdayNotifications = async (birthdayEmployee: any) => {
  try {
    // Get all active employees for the team notification
    const allEmployees = await prisma.employee.findMany({
      where: {
        isActive: true,
        id: { not: birthdayEmployee.id }, // Exclude the birthday person
      },
      include: {
        branch: true,
      },
    });

    const birthdayPersonName = birthdayEmployee.name || "Team Member";
    const branchName = birthdayEmployee.branch?.name || "Crosspoint";
    const currentYear = new Date().getFullYear();
    const birthYear = new Date(birthdayEmployee.dateOfBirth).getFullYear();
    const age = currentYear - birthYear;

    // Email to the birthday person
    const birthdayPersonSubject = `🎉 Buon Compleanno! Happy Birthday! - ${birthdayPersonName}`;

    const birthdayPersonEmail = `
🎉 BUON COMPLEANNO! 🎉

Caro/a ${birthdayPersonName},

Tutto il team di ${branchName} vuole augurarti un fantastico ${age}° compleanno! 

Oggi è un giorno speciale per celebrare te e tutto quello che hai portato al nostro team. Il tuo impegno, la tua dedizione e il tuo spirito positivo rendono ogni giorno migliore per tutti noi.

Che questo nuovo anno di vita ti porti:
✨ Gioia e felicità
✨ Successo in tutti i tuoi progetti
✨ Salute e benessere
✨ Momenti indimenticabili con le persone care

Grazie per essere una parte così importante del nostro team. Non vediamo l'ora di continuare a lavorare insieme e di celebrare molti altri compleanni insieme!

Con affetto e stima,
Il Team di ${branchName}

---
🎂 Buon compleanno ancora! 🎂
    `;

    // Email to all other employees
    const teamSubject = `🎉 Oggi è il compleanno di ${birthdayPersonName}!`;

    const teamEmail = `
🎉 COMPLEANNO DEL TEAM! 🎉

Ciao Team!

Oggi è un giorno speciale: è il compleanno di ${birthdayPersonName}! 🎂

${birthdayPersonName} compie ${age} anni oggi e vogliamo tutti insieme augurargli/le un fantastico compleanno!

📍 Branch: ${branchName}
🎂 Età: ${age} anni
📅 Data: ${new Date().toLocaleDateString("it-IT")}

Facciamo tutti insieme un grande applauso per ${birthdayPersonName} e auguriamogli/le una giornata fantastica! 

Se lo vedi oggi, non dimenticare di fargli/le gli auguri! 🎉

Con affetto,
Il Team di ${branchName}

---
🎂 Buon compleanno ${birthdayPersonName}! 🎂
    `;

    // Send email to the birthday person
    if (birthdayEmployee.email) {
      await emailService.sendEmail(
        birthdayEmployee.email,
        birthdayPersonSubject,
        birthdayPersonEmail
      );
      logger.info(`Birthday email sent to: ${birthdayEmployee.email}`);
    }

    // Send email to all other employees
    const employeeEmails = allEmployees
      .filter((emp) => emp.email)
      .map((emp) => emp.email);

    if (employeeEmails.length > 0) {
      await Promise.all(
        employeeEmails.map((email) =>
          emailService.sendEmail(email, teamSubject, teamEmail)
        )
      );

      logger.info(
        `Birthday team notifications sent to ${employeeEmails.length} employees`
      );
    }
  } catch (error) {
    logger.error(
      `Error sending birthday notifications for employee ${birthdayEmployee.id}:`,
      error
    );
  }
};

/**
 * Initialize cron jobs
 */
const initializeCronJobs = () => {
  // Run every day at 9:00 AM for overdue invoices
  cron.schedule(
    "0 9 * * *",
    () => {
      logger.info("Running daily overdue invoice check...");
      checkOverdueInvoices();
    },
    {
      timezone: "Europe/Rome", // Italy timezone
    }
  );

  // Run every 6 hours for task deadline notifications
  cron.schedule(
    "0 */6 * * *",
    () => {
      logger.info("Running task deadline check...");
      checkTaskDeadlines();
    },
    {
      timezone: "Europe/Rome", // Italy timezone
    }
  );

  // Run every day at 9:30 AM for birthday notifications
  cron.schedule(
    "30 9 * * *",
    () => {
      logger.info("Running employee birthday check...");
      checkEmployeeBirthdays();
    },
    {
      timezone: "Europe/Rome", // Italy timezone
    }
  );

  // Run every day at 9:00 PM Italian time for auto clockout
  cron.schedule(
    "0 21 * * *",
    () => {
      logger.info("Running auto clockout check...");
      autoClockOut();
    },
    {
      timezone: "Europe/Rome", // Italy timezone
    }
  );

  logger.info(
    "Cron jobs initialized - overdue invoice check at 9:00 AM, task deadline check every 6 hours, birthday check at 9:30 AM daily, auto clockout at 9:00 PM daily"
  );
};

export default {
  checkOverdueInvoices,
  sendOverdueNotification,
  checkTaskDeadlines,
  sendTaskDeadlineNotification,
  checkEmployeeBirthdays,
  sendBirthdayNotifications,
  autoClockOut,
  sendAutoClockOutNotification,
  initializeCronJobs,
};
