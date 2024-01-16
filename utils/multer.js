const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

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
function cropToSquare(filePath, outputPath, width, height) {
  return new Promise((resolve, reject) => {
    sharp(filePath)
      .resize({
        width: width,
        height: height,
        fit: "cover",
        position: "center",
      })
      .toFormat("webp")
      .toBuffer((err, buffer) => {
        if (err) {
          console.error("Error occurred while cropping the image:", err);
          reject(err);
        } else {
          fs.writeFile(outputPath, buffer, (writeErr) => {
            if (writeErr) {
              console.error("Error writing cropped image:", writeErr);
              reject(writeErr);
            } else {
              console.log(
                "Image cropped successfully and saved as:",
                outputPath
              );
              resolve();
            }
          });
        }
      });
  });
}
module.exports = { upload, cropToSquare };
