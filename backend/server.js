require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Job = require("./models/Job");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection Logic
const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // Use MongoDB Memory Server for fast zero-setup development if no external URI is provided
    if (!uri || uri.includes("localhost")) {
      try {
        const { MongoMemoryServer } = require("mongodb-memory-server");
        const mongoServer = await MongoMemoryServer.create();
        uri = mongoServer.getUri();
        console.log("Using In-Memory MongoDB for zero-setup development.");
      } catch (err) {
        console.warn("Failed to start MongoMemoryServer, falling back to .env URI:", err.message);
      }
    }

    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Could not connect to MongoDB:", err);
    process.exit(1);
  }
};

connectDB();

// GET all jobs
app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new job
app.post("/api/jobs", async (req, res) => {
  const { title, company, location, description, type, category } = req.body;

  const job = new Job({
    title,
    company,
    location,
    description,
    type: type || "Full-time",
    category: category || "General"
  });

  try {
    const newJob = await job.save();
    res.status(201).json(newJob);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
