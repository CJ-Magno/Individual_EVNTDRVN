import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs";

const uploadDir = path.resolve("public/uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = {
  "image/jpeg": ".jpg",
  "image/png":  ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `${crypto.randomUUID()}${allowedTypes[file.mimetype]}`),
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes[file.mimetype]) return cb(new Error("Unsupported image format."));
    cb(null, true);
  },
});
