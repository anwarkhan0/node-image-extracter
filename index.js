import { createWorker } from "tesseract.js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { promises as fs } from "fs";
import express from "express";
import path from "path";
const app = express();
const port = 3000;
import multer from "multer";

async function proccessImg(imgName) {
  let txt;
  const __dirname = process.cwd();
  const img = path.join(__dirname, "/images/" + imgName);
  const worker = await createWorker({
    logger: (m) => console.log(m),
  });

  (async () => {
    await worker.loadLanguage("eng");
    await worker.initialize("eng");
    const {
      data: { text },
    } = await worker.recognize(imgName);
    txt = text;
    // Create a new PDFDocument
    const pdfDoc = await PDFDocument.create();

    // Embed the Times Roman font
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    // Add a blank page to the document
    const page = pdfDoc.addPage();

    // Get the width and height of the page
    const { width, height } = page.getSize();

    // Draw a string of text toward the top of the page
    const fontSize = 30;
    page.drawText(text, {
      x: 100,
      y: height - 4 * fontSize,
      size: fontSize,
      font: timesRomanFont,
      color: rgb(0, 0.53, 0.71),
    });

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Save the PDF to a file
    await fs.writeFile("extracted-text.pdf", pdfBytes);

    console.log("Text extracted and saved to extracted-text.pdf");
    await worker.terminate();
  })();
  return txt;
}

// Set storage engine
const storage = multer.diskStorage({
  destination: "./images/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000000000000 },
}).single("img");

app.get("/", (req, res) => {
  const __dirname = process.cwd();
  const page = path.join(__dirname, "/homepage.html");
  res.sendFile(page);
});

app.post("/extract", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.send(err);
    } else {
      if (req.file == undefined) {
        res.send("Error: No File Selected!");
      } else {
        res.send("File Uploaded!");
        proccessImg(req.file.filename);
      }
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
