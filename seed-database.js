const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Italian cities, provinces, and postal codes data
const italianCities = [
  { city: "Roma", province: "RM", postalCode: "00100" },
  { city: "Milano", province: "MI", postalCode: "20100" },
  { city: "Napoli", province: "NA", postalCode: "80100" },
  { city: "Torino", province: "TO", postalCode: "10100" },
  { city: "Palermo", province: "PA", postalCode: "90100" },
  { city: "Genova", province: "GE", postalCode: "16100" },
  { city: "Bologna", province: "BO", postalCode: "40100" },
  { city: "Firenze", province: "FI", postalCode: "50100" },
  { city: "Bari", province: "BA", postalCode: "70100" },
  { city: "Catania", province: "CT", postalCode: "95100" },
  { city: "Venezia", province: "VE", postalCode: "30100" },
  { city: "Verona", province: "VR", postalCode: "37100" },
  { city: "Messina", province: "ME", postalCode: "98100" },
  { city: "Padova", province: "PD", postalCode: "35100" },
  { city: "Trieste", province: "TS", postalCode: "34100" },
  { city: "Brescia", province: "BS", postalCode: "25100" },
  { city: "Parma", province: "PR", postalCode: "43100" },
  { city: "Taranto", province: "TA", postalCode: "74100" },
  { city: "Prato", province: "PO", postalCode: "59100" },
  { city: "Modena", province: "MO", postalCode: "41100" },
];

// Italian names for realistic data
const italianNames = [
  "Marco Rossi",
  "Giulia Bianchi",
  "Alessandro Ferrari",
  "Francesca Romano",
  "Luca Conti",
  "Chiara Ricci",
  "Matteo Gallo",
  "Valentina De Luca",
  "Andrea Marchetti",
  "Sofia Lombardi",
  "Davide Moretti",
  "Elena Barbieri",
  "Stefano Fontana",
  "Martina Santoro",
  "Roberto Pellegrini",
  "Alessia Rizzo",
  "Francesco Leone",
  "Giulia Martini",
  "Antonio Greco",
  "Federica Bruno",
  "Giuseppe Russo",
  "Silvia Colombo",
  "Mario Giordano",
  "Elisa Mancini",
  "Paolo Villa",
  "Laura Ferri",
  "Simone Costa",
  "Monica Galli",
];

// Italian surnames
const italianSurnames = [
  "Rossi",
  "Russo",
  "Ferrari",
  "Esposito",
  "Bianchi",
  "Romano",
  "Colombo",
  "Ricci",
  "Marino",
  "Greco",
  "Bruno",
  "Galli",
  "Conti",
  "De Luca",
  "Costa",
  "Giordano",
  "Mancini",
  "Rizzo",
  "Lombardi",
  "Moretti",
  "Barbieri",
  "Fontana",
  "Santoro",
  "Mariani",
  "Rinaldi",
  "Caruso",
  "Ferrara",
  "Galli",
  "Martelli",
  "Leone",
  "Longo",
  "Gentile",
  "Martinelli",
  "Vitale",
  "Lombardo",
  "Serra",
];

// Service categories and names
const serviceCategories = [
  "Consulenza",
  "Sviluppo Software",
  "Design",
  "Marketing",
  "Contabilità",
  "Legale",
  "Risorse Umane",
  "IT Support",
  "Formazione",
  "Analisi",
];

const serviceNames = [
  "Consulenza Strategica",
  "Sviluppo Web Application",
  "Design Grafico",
  "Marketing Digitale",
  "Contabilità e Fatturazione",
  "Consulenza Legale",
  "Gestione Risorse Umane",
  "Supporto Tecnico IT",
  "Corsi di Formazione",
  "Analisi dei Dati",
  "Consulenza Fiscale",
  "Brand Identity",
  "Social Media Management",
  "Audit Aziendale",
  "Progettazione Database",
  "Consulenza Finanziaria",
  "Gestione Progetti",
  "SEO e SEM",
  "Consulenza Organizzativa",
  "Sviluppo Mobile App",
];

// Generate Italian tax code (simplified version)
function generateCodiceFiscale(
  name,
  surname,
  birthDate,
  gender,
  cityCode = "H501"
) {
  const vowels = "AEIOU";
  const consonants = "BCDFGHJKLMNPQRSTVWXYZ";

  // Extract consonants from surname (up to 3)
  let surnameConsonants = surname
    .replace(/[AEIOU]/gi, "")
    .toUpperCase()
    .substring(0, 3);
  while (surnameConsonants.length < 3) {
    surnameConsonants += "X";
  }

  // Extract consonants from name (up to 3)
  let nameConsonants = name
    .replace(/[AEIOU]/gi, "")
    .toUpperCase()
    .substring(0, 3);
  while (nameConsonants.length < 3) {
    nameConsonants += "X";
  }

  // Birth year (last 2 digits)
  const year = birthDate.getFullYear().toString().substring(2);

  // Birth month
  const months = "ABCDEHLMPRST";
  const month = months[birthDate.getMonth()];

  // Birth day (add 40 for females)
  let day = birthDate.getDate();
  if (gender === "F") day += 40;
  const dayStr = day.toString().padStart(2, "0");

  // City code (simplified)
  const cityCodeStr = cityCode;

  // Generate random control character
  const controlChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const controlChar =
    controlChars[Math.floor(Math.random() * controlChars.length)];

  return (
    surnameConsonants +
    nameConsonants +
    year +
    month +
    dayStr +
    cityCodeStr +
    controlChar
  );
}

// Generate random date within a range
function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

// Generate random phone number
function generatePhoneNumber() {
  const prefixes = [
    "320",
    "321",
    "322",
    "323",
    "324",
    "325",
    "326",
    "327",
    "328",
    "329",
    "330",
    "331",
    "332",
    "333",
    "334",
    "335",
    "336",
    "337",
    "338",
    "339",
    "340",
    "341",
    "342",
    "343",
    "344",
    "345",
    "346",
    "347",
    "348",
    "349",
    "350",
    "351",
    "352",
    "353",
    "354",
    "355",
    "356",
    "357",
    "358",
    "359",
    "360",
    "361",
    "362",
    "363",
    "364",
    "365",
    "366",
    "367",
    "368",
    "369",
    "370",
    "371",
    "372",
    "373",
    "374",
    "375",
    "376",
    "377",
    "378",
    "379",
    "380",
    "381",
    "382",
    "383",
    "384",
    "385",
    "386",
    "387",
    "388",
    "389",
    "390",
    "391",
    "392",
    "393",
    "394",
    "395",
    "396",
    "397",
    "398",
    "399",
  ];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 10000000)
    .toString()
    .padStart(7, "0");
  return prefix + number;
}

// Generate IBAN
function generateIBAN() {
  const prefixes = [
    "IT60",
    "IT61",
    "IT62",
    "IT63",
    "IT64",
    "IT65",
    "IT66",
    "IT67",
    "IT68",
    "IT69",
    "IT70",
    "IT71",
    "IT72",
    "IT73",
    "IT74",
    "IT75",
    "IT76",
    "IT77",
    "IT78",
    "IT79",
  ];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 100000000000000000000000)
    .toString()
    .padStart(22, "0");
  return prefix + number;
}

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Clear existing data (in reverse order of dependencies)
    console.log("🧹 Clearing existing data...");
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.task.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.token.deleteMany();
    await prisma.otp.deleteMany();
    await prisma.client.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.service.deleteMany();
    await prisma.bankAccount.deleteMany();
    await prisma.branch.deleteMany();

    // 1. Create Branches (15 branches)
    console.log("🏢 Creating branches...");
    const branches = [];
    for (let i = 1; i <= 15; i++) {
      const city = italianCities[i - 1];
      const branch = await prisma.branch.create({
        data: {
          branchId: `BR-${i.toString().padStart(3, "0")}`,
          name: `Sede ${city.city}`,
          address: `Via Roma ${Math.floor(Math.random() * 200) + 1}`,
          city: city.city,
          postalCode: city.postalCode,
          province: city.province,
          phone: generatePhoneNumber(),
          email: `sede${i}@crosspoint.it`,
          isActive: Math.random() > 0.1,
        },
      });
      branches.push(branch);
    }

    // 2. Create Bank Accounts (15 accounts)
    console.log("🏦 Creating bank accounts...");
    const bankAccounts = [];
    const bankNames = [
      "Intesa Sanpaolo",
      "UniCredit",
      "Banca Popolare di Sondrio",
      "Banco BPM",
      "Banca Sella",
      "Credito Emiliano",
      "Banca Popolare di Milano",
      "Monte dei Paschi di Siena",
      "Banca Nazionale del Lavoro",
      "Banca Carige",
      "Banca Popolare di Vicenza",
      "Banca Popolare di Bergamo",
      "Banca Popolare di Sondrio",
      "Banca Popolare di Novara",
      "Banca Popolare di Verona",
    ];

    for (let i = 0; i < 15; i++) {
      const bankAccount = await prisma.bankAccount.create({
        data: {
          bankName: bankNames[i],
          bankIban: generateIBAN(),
          accountNumber: Math.floor(
            Math.random() * 1000000000000000000
          ).toString(),
          bankSwiftCode: `UNCRIT${Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0")}`,
          accountName: `Crosspoint S.r.l. - ${bankNames[i]}`,
          isActive: Math.random() > 0.1,
        },
      });
      bankAccounts.push(bankAccount);
    }

    // 3. Create Services (20 services)
    console.log("🔧 Creating services...");
    const services = [];
    for (let i = 0; i < 20; i++) {
      const service = await prisma.service.create({
        data: {
          serviceId: `SRV-${(i + 1).toString().padStart(3, "0")}`,
          name: serviceNames[i],
          price: Math.floor(Math.random() * 500) + 50, // 50-550 EUR
          category: serviceCategories[i % serviceCategories.length],
        },
      });
      services.push(service);
    }

    // 4. Create Employees (15 employees)
    console.log("👥 Creating employees...");
    const employees = [];
    const roles = ["ADMIN", "HR", "MANAGER", "EMPLOYEE"];
    const allPermissions = [
      "CREATE_CLIENT",
      "READ_CLIENT",
      "UPDATE_CLIENT",
      "DELETE_CLIENT",
      "CREATE_SERVICE",
      "READ_SERVICE",
      "UPDATE_SERVICE",
      "DELETE_SERVICE",
      "CREATE_INVOICE",
      "READ_INVOICE",
      "UPDATE_INVOICE",
      "DELETE_INVOICE",
      "CREATE_TASK",
      "READ_TASK",
      "UPDATE_TASK",
      "DELETE_TASK",
      "ASSIGN_TASK",
      "CREATE_BANK_ACCOUNT",
      "READ_BANK_ACCOUNT",
      "UPDATE_BANK_ACCOUNT",
      "DELETE_BANK_ACCOUNT",
      "GENERATE_REPORTS",
      "VIEW_REPORTS",
      "CREATE_EMPLOYEE",
      "READ_EMPLOYEE",
      "UPDATE_EMPLOYEE",
      "DELETE_EMPLOYEE",
      "MANAGE_EMPLOYEES",
      "ASSIGN_PERMISSIONS",
      "CREATE_BRANCH",
      "READ_BRANCH",
      "UPDATE_BRANCH",
      "DELETE_BRANCH",
      "CREATE_PAYMENT_METHOD",
      "READ_PAYMENT_METHOD",
      "UPDATE_PAYMENT_METHOD",
      "DELETE_PAYMENT_METHOD",
    ];

    for (let i = 0; i < 15; i++) {
      const nameParts = italianNames[i].split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts[1];
      const birthDate = randomDate(
        new Date(1970, 0, 1),
        new Date(2000, 11, 31)
      );
      const gender = Math.random() > 0.5 ? "M" : "F";
      const codiceFiscale = generateCodiceFiscale(
        firstName,
        lastName,
        birthDate,
        gender
      );
      const hashedPassword = await bcrypt.hash("Password123!", 8);

      const role =
        i === 0 ? "ADMIN" : roles[Math.floor(Math.random() * roles.length)];
      const permissions =
        role === "ADMIN"
          ? allPermissions
          : role === "MANAGER"
          ? allPermissions.slice(0, 20)
          : role === "HR"
          ? allPermissions.slice(0, 15)
          : allPermissions.slice(0, 10);

      const employee = await prisma.employee.create({
        data: {
          employeeId: `EMP-${branches[i % branches.length].branchId}-${(i + 1)
            .toString()
            .padStart(3, "0")}`,
          nationalIdentificationNumber: codiceFiscale,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@crosspoint.it`,
          name: italianNames[i],
          password: hashedPassword,
          role: role,
          branchId: branches[i % branches.length].id,
          dateOfBirth: birthDate,
          profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}`,
          isEmailVerified: Math.random() > 0.1,
          isActive: Math.random() > 0.1,
          permissions: permissions,
        },
      });
      employees.push(employee);
    }

    // 5. Create Clients (15 clients)
    console.log("👤 Creating clients...");
    const clients = [];
    for (let i = 0; i < 15; i++) {
      // Use modulo to cycle through available names
      const nameIndex = (i + 15) % italianNames.length;
      const nameParts = italianNames[nameIndex].split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts[1];
      const birthDate = randomDate(
        new Date(1970, 0, 1),
        new Date(2000, 11, 31)
      );
      const gender = Math.random() > 0.5 ? "M" : "F";
      const codiceFiscale = generateCodiceFiscale(
        firstName,
        lastName,
        birthDate,
        gender
      );
      const city =
        italianCities[Math.floor(Math.random() * italianCities.length)];

      const client = await prisma.client.create({
        data: {
          clientId: `CLT-${branches[i % branches.length].branchId}-${(i + 1)
            .toString()
            .padStart(3, "0")}`,
          nationalIdentificationNumber: codiceFiscale,
          name: italianNames[nameIndex],
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.it`,
          phone: generatePhoneNumber(),
          address: `Via ${
            italianSurnames[Math.floor(Math.random() * italianSurnames.length)]
          } ${Math.floor(Math.random() * 200) + 1}`,
          city: city.city,
          postalCode: city.postalCode,
          province: city.province,
          branchId: branches[i % branches.length].id,
        },
      });
      clients.push(client);
    }

    // 6. Create Tasks (15 tasks)
    console.log("📋 Creating tasks...");
    const tasks = [];
    const taskStatuses = [
      "PENDING",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "ON_HOLD",
    ];
    const taskTitles = [
      "Sviluppo Sito Web Aziendale",
      "Consulenza Marketing Digitale",
      "Analisi Contabile Mensile",
      "Progettazione Logo Aziendale",
      "Implementazione CRM",
      "Audit di Sicurezza IT",
      "Formazione del Personale",
      "Ottimizzazione Processi",
      "Ricerca di Mercato",
      "Sviluppo App Mobile",
      "Consulenza Legale",
      "Gestione Social Media",
      "Analisi Finanziaria",
      "Progettazione Database",
      "Consulenza Fiscale",
    ];

    for (let i = 0; i < 15; i++) {
      const startDate = randomDate(
        new Date(2024, 0, 1),
        new Date(2024, 11, 31)
      );
      const dueDate = new Date(
        startDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000
      ); // 30 days later
      const completedDate =
        Math.random() > 0.3
          ? new Date(
              startDate.getTime() +
                Math.random() * (dueDate.getTime() - startDate.getTime())
            )
          : null;

      const task = await prisma.task.create({
        data: {
          taskId: `TSK-${branches[i % branches.length].branchId}-2024-${(i + 1)
            .toString()
            .padStart(3, "0")}`,
          title: taskTitles[i],
          description: `Descrizione dettagliata per il task: ${taskTitles[i]}. Questo task include tutte le specifiche necessarie per completare il progetto con successo.`,
          clientId: clients[i].id,
          serviceId: services[i % services.length].id,
          assignedEmployeeId: employees[i % employees.length].id,
          status: taskStatuses[Math.floor(Math.random() * taskStatuses.length)],
          dueDate: dueDate,
          startDate: startDate,
          completedDate: completedDate,
          estimatedHours: Math.floor(Math.random() * 40) + 8, // 8-48 hours
          actualHours: completedDate
            ? Math.floor(Math.random() * 40) + 8
            : null,
          notes: `Note aggiuntive per il task ${
            i + 1
          }: monitoraggio continuo e aggiornamenti regolari.`,
        },
      });
      tasks.push(task);
    }

    // 7. Create Invoices (15 invoices)
    console.log("🧾 Creating invoices...");
    const invoices = [];
    const invoiceStatuses = ["UNPAID", "PAID", "OVERDUE", "CANCELLED"];
    const paymentMethods = [
      "Internet Banking",
      "Bonifico Bancario",
      "Carta di Credito",
      "PayPal",
      "Contanti",
    ];

    for (let i = 0; i < 15; i++) {
      const subTotal = Math.floor(Math.random() * 2000) + 500; // 500-2500 EUR
      const discountAmount = Math.floor(Math.random() * 100); // 0-100 EUR discount
      const taxRate = 22; // Italian VAT rate
      const taxAmount = Math.round(
        ((subTotal - discountAmount) * taxRate) / 100
      );
      const totalAmount = subTotal - discountAmount + taxAmount;
      const issuedDate = randomDate(
        new Date(2024, 0, 1),
        new Date(2024, 11, 31)
      );
      const dueDate = new Date(issuedDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days later

      const invoice = await prisma.invoice.create({
        data: {
          invoiceId: `INV-${branches[i % branches.length].branchId}-2024-${(
            i + 1
          )
            .toString()
            .padStart(3, "0")}`,
          invoiceNumber: `INV-2024-${(i + 1).toString().padStart(4, "0")}`,
          clientId: clients[i].id,
          taskId: tasks[i].id,
          totalAmount: totalAmount,
          subTotalAmount: subTotal,
          discountAmount: discountAmount,
          taxAmount: taxAmount,
          taxRate: taxRate,
          status:
            invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)],
          dueDate: dueDate,
          issuedDate: issuedDate,
          branchId: branches[i % branches.length].id,
          employeeId: employees[i % employees.length].id,
          bankAccountId: bankAccounts[i % bankAccounts.length].id,
          paymentMethod:
            paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          notes: `Fattura per servizi professionali - ${taskTitles[i]}`,
          thanksMessage: "Grazie per aver scelto i nostri servizi!",
          paymentTerms: "Pagamento entro 30 giorni dalla data di emissione",
          companyName: "Crosspoint S.r.l.",
          companyTagline: "Soluzioni Professionali per la Tua Azienda",
          companyAddress: "Via Roma 123, 00100 Roma",
          companyCity: "Roma",
          companyPhone: "+39 06 1234567",
          companyEmail: "info@crosspoint.it",
          companyWebsite: "www.crosspoint.it",
          companyLogo:
            "https://via.placeholder.com/150x50/0066CC/FFFFFF?text=Crosspoint",
        },
      });
      invoices.push(invoice);
    }

    // 8. Create Invoice Items (30 items - 2 per invoice)
    console.log("📄 Creating invoice items...");
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 2; j++) {
        const service = services[Math.floor(Math.random() * services.length)];
        const rate = service.price;
        const discount = Math.floor(Math.random() * 20); // 0-20% discount
        const total = Math.round(rate * (1 - discount / 100));

        await prisma.invoiceItem.create({
          data: {
            invoiceId: invoices[i].id,
            serviceId: service.id,
            description: `Servizio: ${service.name} - ${service.category}`,
            rate: rate,
            discount: discount,
            total: total,
          },
        });
      }
    }

    // 9. Create Attendance records (180 records - 12 per employee for different days)
    console.log("⏰ Creating attendance records...");
    const attendanceStatuses = [
      "PRESENT",
      "ABSENT",
      "LATE",
      "HALF_DAY",
      "LEAVE",
      "HOLIDAY",
    ];

    for (let i = 0; i < employees.length; i++) {
      for (let j = 0; j < 12; j++) {
        const date = randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31));
        const status =
          attendanceStatuses[
            Math.floor(Math.random() * attendanceStatuses.length)
          ];
        let checkIn = null;
        let checkOut = null;
        let totalHours = null;

        if (status === "PRESENT" || status === "LATE") {
          checkIn = new Date(date);
          checkIn.setHours(
            8 + Math.floor(Math.random() * 2),
            Math.floor(Math.random() * 60),
            0,
            0
          );
          checkOut = new Date(checkIn);
          checkOut.setHours(
            checkIn.getHours() + 8 + Math.floor(Math.random() * 2),
            Math.floor(Math.random() * 60),
            0,
            0
          );
          totalHours =
            (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
        } else if (status === "HALF_DAY") {
          checkIn = new Date(date);
          checkIn.setHours(8, 0, 0, 0);
          checkOut = new Date(checkIn);
          checkOut.setHours(12, 0, 0, 0);
          totalHours = 4;
        }

        await prisma.attendance.create({
          data: {
            employeeId: employees[i].id,
            date: date,
            checkIn: checkIn,
            checkOut: checkOut,
            totalHours: totalHours,
            status: status,
            notes:
              status === "LATE"
                ? "Arrivo in ritardo"
                : status === "HALF_DAY"
                ? "Mezza giornata"
                : null,
          },
        });
      }
    }

    // 10. Create OTP records (15 records)
    console.log("🔐 Creating OTP records...");
    for (let i = 0; i < 15; i++) {
      const otp = Math.floor(Math.random() * 900000) + 100000; // 6-digit OTP
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      await prisma.otp.create({
        data: {
          email: employees[i].email,
          otp: otp.toString(),
          expiresAt: expiresAt,
          attempts: Math.floor(Math.random() * 3),
          verified: Math.random() > 0.5,
        },
      });
    }

    // 11. Create Token records (30 records - 2 per employee)
    console.log("🎫 Creating token records...");
    const tokenTypes = ["ACCESS", "REFRESH", "RESET_PASSWORD", "VERIFY_EMAIL"];

    for (let i = 0; i < employees.length; i++) {
      for (let j = 0; j < 2; j++) {
        const token =
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);
        const expires = new Date(
          Date.now() + (j === 0 ? 15 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000)
        ); // 15 min or 7 days

        await prisma.token.create({
          data: {
            token: token,
            type: tokenTypes[j],
            expires: expires,
            blacklisted: Math.random() > 0.8,
            employeeId: employees[i].id,
          },
        });
      }
    }

    console.log("✅ Database seeding completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   🏢 Branches: ${branches.length}`);
    console.log(`   🏦 Bank Accounts: ${bankAccounts.length}`);
    console.log(`   🔧 Services: ${services.length}`);
    console.log(`   👥 Employees: ${employees.length}`);
    console.log(`   👤 Clients: ${clients.length}`);
    console.log(`   📋 Tasks: ${tasks.length}`);
    console.log(`   🧾 Invoices: ${invoices.length}`);
    console.log(`   📄 Invoice Items: ${invoices.length * 2}`);
    console.log(`   ⏰ Attendance Records: ${employees.length * 12}`);
    console.log(`   🔐 OTP Records: 15`);
    console.log(`   🎫 Token Records: ${employees.length * 2}`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed script
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("🎉 Seeding process completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding process failed:", error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
