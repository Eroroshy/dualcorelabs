const { supabase } = require("../subapaseClient");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Token de autorización requerido (Bearer)",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      console.error("Error de autenticación de Supabase:", error);
      return res.status(401).json({
        message: "Token inválido o expirado",
      });
    }

    req.user = data.user;
    next();
  } catch (error) {
    console.error("Excepción en el middleware de autenticación:", error);
    return res.status(401).json({
      message: "Token inválido",
    });
  }
};