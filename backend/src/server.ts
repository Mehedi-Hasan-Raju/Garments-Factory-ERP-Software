import "dotenv/config";
import app from "./app.js";


const PORT = Number(process.env.PORT) || 5000;


const server = app.listen(PORT, () => {
  console.log(`Garments ERP server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down server...");

  server.close(() => {
    console.log("Server closed successfully.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down server...");

  server.close(() => {
    console.log("Server closed successfully.");
    process.exit(0);
  });
});
