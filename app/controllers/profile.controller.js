const Profile = require("../models/profile.model");
const User = require("../models/user.model");

const getProfile = async (req, res) => {
  try {
    const result = await Profile.findByUsuarioId(req.user.id);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Perfil no encontrado"
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const {
      nombre,
      edad,
      peso_kg,
      altura_cm,
      nivel_experiencia,
      objetivo,
      foto_url
    } = req.body;

    const parsedEdad = edad !== undefined && edad !== null ? parseInt(edad, 10) : null;
    const parsedPeso = peso_kg !== undefined && peso_kg !== null ? parseFloat(peso_kg) : null;
    const parsedAltura = altura_cm !== undefined && altura_cm !== null ? parseFloat(altura_cm) : null;

    const userResult = await User.updateNameById(req.user.id, nombre);
    const profileResult = await Profile.upsertByUsuarioId(
      req.user.id,
      parsedEdad,
      parsedPeso,
      parsedAltura,
      nivel_experiencia,
      objetivo,
      foto_url
    );

    res.json({
      user: {
        ...userResult.rows[0],
        profile: profileResult.rows[0]
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile
};
