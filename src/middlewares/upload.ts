import multer from "multer";
import path from "path";

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  // Allow images and common document types
  const allowedMimeTypes = [
    "image/",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ];
  
  const isAllowed = allowedMimeTypes.some(type => file.mimetype.startsWith(type) || file.mimetype === type);
  
  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed! Allowed types: images, PDF, Word, Excel, text files"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export { upload };
