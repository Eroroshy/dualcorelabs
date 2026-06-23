const express = require("express");
const router = express.Router();

router.get("/nearby", async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ message: "lat y lng requeridos" });

  try {
   const url = `https://api.tomtom.com/search/2/search/gimnasio.json?lat=${lat}&lon=${lng}&radius=5000&limit=20&key=38r6oqYIM7Zxp8mhmPnanSfhZkB8QknU`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json();
    console.log("TomTom status:", response.status);
    console.log("TomTom results:", data.results?.length);

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
    console.log("Gym route error:", e.message);
    res.status(500).json({ message: "Error al buscar gimnasios", error: e.message });
  }
});

module.exports = router;