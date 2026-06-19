const pool = require("../config/db");

const createProfile = async (usuarioId) => {
  return await pool.query(
    `
    INSERT INTO perfiles (usuario_id)
    VALUES ($1)
    RETURNING *
    `,
    [usuarioId]
  );
};

const findByUsuarioId = async (usuarioId) => {
  return await pool.query(
    `
    SELECT
      id,
      usuario_id,
      edad,
      peso_kg,
      altura_cm,
      nivel_experiencia,
      objetivo,
      foto_url,
      actualizado_en
    FROM perfiles
    WHERE usuario_id = $1
    `,
    [usuarioId]
  );
};

const upsertByUsuarioId = async (
  usuarioId,
  edad,
  pesoKg,
  alturaCm,
  nivelExperiencia,
  objetivo,
  fotoUrl
) => {
  return await pool.query(
    `
    INSERT INTO perfiles (
      usuario_id,
      edad,
      peso_kg,
      altura_cm,
      nivel_experiencia,
      objetivo,
      foto_url
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (usuario_id) DO UPDATE SET
      edad = EXCLUDED.edad,
      peso_kg = EXCLUDED.peso_kg,
      altura_cm = EXCLUDED.altura_cm,
      nivel_experiencia = EXCLUDED.nivel_experiencia,
      objetivo = EXCLUDED.objetivo,
      foto_url = EXCLUDED.foto_url,
      actualizado_en = NOW()
    RETURNING *
    `,
    [
      usuarioId,
      edad,
      pesoKg,
      alturaCm,
      nivelExperiencia,
      objetivo,
      fotoUrl,
    ]
  );
};

module.exports = {
  createProfile,
  findByUsuarioId,
  upsertByUsuarioId,
};
