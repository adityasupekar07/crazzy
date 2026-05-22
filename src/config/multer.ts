import multer from "multer";

import path from "path";

import fs from "fs";

import ApiError from "../utils/ApiError.js";

/**
 * =========================================
 * CREATE UPLOAD DIRECTORY
 * =========================================
 */

const uploadPath = path.resolve(
  "uploads"
);

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, {
    recursive: true,
  });
}

/**
 * =========================================
 * STORAGE
 * =========================================
 */

const storage = multer.diskStorage({
  destination: (
    req,
    file,
    cb
  ) => {
    cb(null, uploadPath);
  },

  filename: (
    req,
    file,
    cb
  ) => {
    const uniqueName =
      `${Date.now()}-${file.originalname}`;

    cb(null, uniqueName);
  },
});

/**
 * =========================================
 * FILE FILTER
 * =========================================
 */

const fileFilter: multer.Options["fileFilter"] =
  (req, file, cb) => {

    const allowedMimeTypes = [
      "application/vnd.ms-excel",

      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

      "text/csv",
    ];

    if (
      allowedMimeTypes.includes(
        file.mimetype
      )
    ) {
      cb(null, true);
    } else {
      cb(
        new ApiError(
          400,
          "Only Excel/CSV files allowed"
        ) as any,

        false
      );
    }
  };

/**
 * =========================================
 * MULTER INSTANCE
 * =========================================
 */

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize:
      10 * 1024 * 1024,
  },
});

export default upload;