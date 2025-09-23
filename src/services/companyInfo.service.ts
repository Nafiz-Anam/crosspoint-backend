import { PrismaClient } from "@prisma/client";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { Request } from "express";
import config from "../config/config";

const prisma = new PrismaClient();

// In-memory storage for company info (in production, this would be in a database)
let companyInfoStore = {
  id: "default",
  companyName: "Crosspoint",
  tagline: "TO MAKE A BETTER COMMUNITY",
  address: "Office 149, 450 South Brand Brooklyn",
  city: "San Diego County, CA 91905, USA",
  phone: "+1 (123) 456 7891, +44 (876) 543 2198",
  email: "info@crosspoint.com",
  website: "www.crosspoint.com",
  logo: "/images/logos/main_logo.png",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const getCompanyInfo = async () => {
  // Return the stored company info
  return companyInfoStore;
};

const updateCompanyInfo = async (companyData: any) => {
  // Handle base64 image data
  if (companyData.logo && companyData.logo.startsWith("data:image/")) {
    try {
      // Extract base64 data
      const base64Data = companyData.logo.replace(
        /^data:image\/[a-z]+;base64,/,
        ""
      );
      const buffer = Buffer.from(base64Data, "base64");

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "logos");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Extract file extension from data URL
      const mimeMatch = companyData.logo.match(/data:image\/([a-z]+);base64,/);
      const fileExtension = mimeMatch ? `.${mimeMatch[1]}` : ".png";
      const fileName = `logo-${Date.now()}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      // Save file
      const writeFile = promisify(fs.writeFile);
      await writeFile(filePath, buffer);

      // Update companyData with the full URL
      companyData.logo = `${config.baseUrl}/uploads/logos/${fileName}`;
    } catch (error) {
      console.error("Error processing logo:", error);
      // Keep the original logo if processing fails
    }
  }

  // Update the stored company info
  companyInfoStore = {
    ...companyInfoStore,
    ...companyData,
    updatedAt: new Date(),
  };

  return companyInfoStore;
};

const uploadLogo = async (file: any) => {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "logos");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `logo-${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file
    const writeFile = promisify(fs.writeFile);
    await writeFile(filePath, file.buffer);

    // Return the full public URL
    const logoUrl = `${config.baseUrl}/uploads/logos/${fileName}`;

    return logoUrl;
  } catch (error) {
    console.error("Error uploading logo:", error);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to upload logo"
    );
  }
};

export default {
  getCompanyInfo,
  updateCompanyInfo,
  uploadLogo,
};
