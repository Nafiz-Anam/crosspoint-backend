import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";

interface UploadOptions {
  dest: string; // Destination directory
  allowedTypes: RegExp; // Regex for allowed file types
  fileSizeLimit?: number; // Optional max file size in bytes
}

const getUploadMiddleware = ({
  dest,
  allowedTypes,
  fileSizeLimit = 1000000,
}: UploadOptions) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });

  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(
      new Error(
        "Error: File upload only supports the following filetypes - " +
          allowedTypes
      )
    );
  };

  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: fileSizeLimit },
  });
};

export default getUploadMiddleware;
