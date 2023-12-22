const multer = require("multer");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");

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

const cropImage = (inputPath, outputPath, x, y, width, height) => {
  loadImage(inputPath)
    .then((image) => {
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream(); // Change to createJPEGStream if needed

      stream.pipe(out);
      out.on("finish", () => console.log("The image was cropped and saved!"));
    })
    .catch((err) => {
      console.error("Error occurred while cropping the image:", err);
      console.error("Input Image Path:", inputPath);
    });
};

module.exports = { upload, cropImage };
