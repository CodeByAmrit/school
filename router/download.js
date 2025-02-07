const express = require("express");
const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb } = require("pdf-lib");

const router = express.Router();
const uploadDir = path.join(__dirname, "../public/uploads");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Function to generate PDF
async function generatePDF(filePath) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const { width, height } = page.getSize();

    page.drawText("Hello, this is your generated PDF!", {
        x: 50,
        y: height - 50,
        size: 20,
        color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);
}

// Route to generate PDF and return download link
router.get("/generate", async (req, res) => {
    try {
        const fileName = `document_${Date.now()}.pdf`;
        const filePath = path.join(uploadDir, fileName);

        await generatePDF(filePath);

        const downloadUrl = `${req.protocol}://${req.get("host")}/uploads/${fileName}`;
        res.json({ success: true, message: "PDF generated", downloadUrl });
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ success: false, message: "PDF generation failed" });
    }
});

// Serve uploaded files publicly
router.use("/uploads", express.static(uploadDir));

module.exports = router;
