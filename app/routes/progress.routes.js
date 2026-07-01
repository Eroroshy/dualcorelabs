const router = require("express").Router();
const {
  logProgress,
  getProgress,
} = require("../controllers/progress.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Aplica el middleware de autenticación a todas las rutas de progreso
router.use(authMiddleware);

router.post("/", logProgress);
router.get("/", getProgress);

module.exports = router;
