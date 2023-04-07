const express = require("express");
const router = express.Router();
const multer = require("multer");
const { route } = require("./user_route");
const path = require("path");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); //../upload is the file destination of the image we upload
  },
  filename: (req, file, cb) => {
    console.log(file);
    cb(null, file.originalname);
  },
});
const upload = multer({
  storage: storage,

  fileFilter: (res, file, cb) => {
    if (
      file.mimetype === "video/mp4" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/gif"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return res
        .status(400)
        .json({ error: "Please upload gif,jpg, png, jpeg filetype only" });
    }
  },
});
//upload image file functionality
router.post("/uploadfile", upload.single("file"), function (req, res) {
  res.status(201).json({ fileName: req.file.filename });
});
//download functionality
const downloadFile = (req, res) => {
  const fileName = req.params.filename;
  const path = __basedir + "/uploads/";

  res.download(path + fileName, (error) => {
    if (error) {
      res.status(500).send({ message: "File cannot be downloaded" + error });
    }
  });
};
router.get("/files/:filename", downloadFile);
module.exports = router;
