const multer = require("multer");

// File type map for validating uploaded images
const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.originalname.split(".").shift() +
        "-" +
        Date.now() +
        "." +
        file.originalname.split(".").pop()
    );
  },
});

// Add console logs to check the mimetype of the uploaded file
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const isValidFileType = FILE_TYPE_MAP[file.mimetype];
    if (isValidFileType) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PNG, JPEG, and JPG files are allowed."
        ),
        false
      );
    }
  },
});

module.exports=upload;