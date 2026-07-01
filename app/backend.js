const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const gymRoutes = require("./routes/gym.routes");
const progressRoutes = require("./routes/progress.routes");

const app = express();

app.use((req, res, next) => {
  console.log('REQ:', req.method, req.path);
  next();
});

app.use(cors());
app.use(express.json());
console.log('Mounting /api/auth routes');
app.use("/api/auth", authRoutes);
console.log('Mounting /api/profile routes');
app.use("/api/profile", profileRoutes);
app.use("/api/gyms", gymRoutes);
app.use("/api/progress", progressRoutes);

// 404 handler for unknown API routes — return JSON instead of HTML
app.use((req, res, next) => {
  console.log('404 handler reached', req.method, req.path);
  res.status(404).json({ message: "Ruta no encontrada" });
});

// Global error handler — ensures JSON responses for errors (including JSON parse errors)
app.use((err, req, res, next) => {
  console.error(err && err.stack ? err.stack : err);

  // body-parser / express.json JSON parse errors set a status or are SyntaxError
  if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
    return res.status(400).json({ message: 'JSON inválido en el cuerpo de la petición', error: err.message });
  }

  res.status(err && err.status ? err.status : 500).json({ message: err && err.message ? err.message : 'Error interno del servidor' });
});

module.exports = app;
