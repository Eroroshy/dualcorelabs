const router = require("express").Router();
const { getProfile, updateProfile } = require("../controllers/profile.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.use((req, res, next) => {
  console.log('PROFILE ROUTER REQ:', req.method, req.path);
  next();
});

router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, updateProfile);

module.exports = router;
