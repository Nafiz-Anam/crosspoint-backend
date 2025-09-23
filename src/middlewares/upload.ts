import multer from "multer";
import path from "path";

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  // Check file type
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
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
