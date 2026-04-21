const express = require("express");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 3000;

// Useful instance info for load balancer / auto scaling testing
const INSTANCE_ID =
  process.env.INSTANCE_ID ||
  os.hostname();

app.use(express.json());

// Default route
app.get("/", (req, res) => {
  console.log("Calling Default URL ... ");
  res.json({
    success: true,
    message: "Node.js API is running",
    instance: INSTANCE_ID,
    hostname: os.hostname(),
    timestamp: new Date().toISOString(),
  });
});

// Health check route for ALB target group
app.get("/health", (req, res) => {
  console.log("Calling health URL ... ");
  res.status(200).json({
    status: "healthy",
    instance: INSTANCE_ID,
    uptime_seconds: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Info route to know which EC2 handled request
app.get("/info", (req, res) => {
  console.log("Calling info URL ... ");
  res.json({
    instance: INSTANCE_ID,
    hostname: os.hostname(),
    platform: os.platform(),
    cpus: os.cpus().length,
    memory_total_mb: Math.round(os.totalmem() / 1024 / 1024),
    memory_free_mb: Math.round(os.freemem() / 1024 / 1024),
    loadavg: os.loadavg(),
    uptime_seconds: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// CPU stress test
// Example: /stress?seconds=20
app.get("/stress", (req, res) => {
  console.log("Calling stress URL ... ");
  const seconds = Math.min(parseInt(req.query.seconds) || 10, 60);
  const end = Date.now() + seconds * 1000;

  let counter = 0;

  // Busy loop to increase CPU usage
  while (Date.now() < end) {
    counter += Math.sqrt(Math.random() * 1000000);
  }

  res.json({
    success: true,
    message: `CPU stress completed for ${seconds} seconds`,
    instance: INSTANCE_ID,
    hostname: os.hostname(),
    counter,
    timestamp: new Date().toISOString(),
  });
});

// Memory stress test
// Example: /memory?mb=200
const memoryStore = [];

app.get("/memory", (req, res) => {
  console.log("Calling memory URL ... ");
  const mb = Math.min(parseInt(req.query.mb) || 100, 500);

  const buffer = Buffer.alloc(mb * 1024 * 1024, "a");
  memoryStore.push(buffer);

  res.json({
    success: true,
    message: `Allocated approximately ${mb} MB in memory`,
    instance: INSTANCE_ID,
    stored_buffers: memoryStore.length,
    process_memory_mb: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
  });
});

// Free allocated memory
app.get("/memory/clear", (req, res) => {
  memoryStore.length = 0;
  global.gc && global.gc();

  res.json({
    success: true,
    message: "Memory store cleared",
    instance: INSTANCE_ID,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
