const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");

// Aplicar middleware para que solo usuarios logueados puedan usar esta ruta
router.get("/nearby", authMiddleware, async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ message: "lat y lng requeridos" });
  }

  // Leer la clave del API desde las variables de entorno para mayor seguridad
  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey) {
    console.error("La clave de API de TomTom no está configurada en el archivo .env");
    return res.status(500).json({ message: "Error de configuración del servidor." });
  }

  try {
    const url = `https://api.tomtom.com/search/2/search/gimnasio.json?lat=${lat}&lon=${lng}&radius=5000&limit=20&key=${apiKey}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
        throw new Error(`Error en la respuesta de TomTom API: ${response.statusText}`);
    }

    const data = await response.json();
    
    const gyms = (data.results || []).map((place) => ({
      place_id: place.id,
      name: place.poi?.name || "Gimnasio",
      address: place.address?.freeformAddress || "Dirección no disponible",
      lat: place.position?.lat,
      lng: place.position?.lon,
      phone: place.poi?.phone || null,
    }));

    res.json({ gyms });
  } catch (e) {
    console.error("Error en la ruta de gimnasios:", e.message);
    res.status(500).json({ message: "Error al buscar gimnasios", error: e.message });
  }
});

module.exports = router;