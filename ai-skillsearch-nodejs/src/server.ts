import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import multer from "multer";
import pdfParse from "pdf-parse";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get("/", (req, res) => {
  res.json({
    message: "Claude API Backend is running!",
    timestamp: new Date().toISOString(),
  });
});

// Claude chat endpoint
app.post("/api/skills", upload.single("pdf"), async (req, res) => {
  try {
    const { file } = req;

    console.log("file = ", file);

    if (!file) {
      return res.status(400).json({ error: "File is required" });
    }

    if (file.mimetype !== "application/pdf") {
      return res
        .status(400)
        .json({ error: "Only files of type pdf are permitted" });
    }

    const pdfData = await pdfParse(file.buffer);
    const extractedText = pdfData.text;

    /*console.log("Sending to Claude:", message);

    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [{ role: "user", content: message }],
    });

    res.json({
      response: response.content[0].text,
      usage: response.usage,
    }); */
  } catch (error) {
    console.error("Claude API error:", error);
    res.status(500).json({
      error: "Failed to get response from Claude",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Process data endpoint
app.post("/api/process", async (req, res) => {
  try {
    const { data, task } = req.body;

    if (!data || !task) {
      return res.status(400).json({ error: "Data and task are required" });
    }

    const prompt = `Please ${task} this data: ${JSON.stringify(data)}`;

    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    res.json({
      result: response.content[0].text,
      processedAt: new Date().toISOString(),
      originalTask: task,
    });
  } catch (error) {
    console.error("Processing error:", error);
    res.status(500).json({
      error: "Processing failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoints:`);
  console.log(`   GET  /              - Health check`);
  console.log(`   POST /api/chat      - Send message to Claude`);
  console.log(`   POST /api/process   - Process data with Claude`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});
