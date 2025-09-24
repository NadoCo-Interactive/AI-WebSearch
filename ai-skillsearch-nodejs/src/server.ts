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
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Basic health check route
app.get("/", (req, res) => {
  res.json({
    message: "Claude API Backend is running!",
    timestamp: new Date().toISOString(),
  });
});

// .. Claude skill info endpoint - upload skill info here to find out how much the skill is worth at that level e.g.
// 2 years of C# experience vs. 6 months marketing experience
app.post("/api/skillinfo", async (req, res) => {
  // .. generate search queries to search for wages payable for that skill
  // .. generate a description of the skill using claude
  // add the description + skill wages to a JSON object and return it
});

// Claude skills endpoint - upload resume or linkedin profile here to fetch skills
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

    const { content } = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `I have a PDF document with the following content. 
          
          Can you please check it for all references of job positions and individual skills and then give me an array of 
          json objects representing each skill with a "NAME" and "EXPERIENCE" (in years) property. 

          IMPORTANT: Your response must be ONLY the raw JSON array. Do not include any markdown formatting, 
          code blocks, explanations, or other text. Start your response with [ and end with ].

          Example format: [{"NAME": "JavaScript", "EXPERIENCE": 5}, {"NAME": "Python", "EXPERIENCE": 3}]
          
          Document content: ${extractedText}`,
        },
      ],
    });

    const message = content[0].text; //

    const json = JSON.parse(message);

    res.json(json);
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
