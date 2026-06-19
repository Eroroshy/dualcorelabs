const pool = require("./db");

const initDatabase = async () => {
  await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS perfiles (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      edad INTEGER,
      peso_kg NUMERIC(5,2),
      altura_cm NUMERIC(5,1),
      nivel_experiencia VARCHAR(20) DEFAULT 'principiante' CHECK (nivel_experiencia IN ('principiante','intermedio','avanzado')),
      objetivo VARCHAR(50) CHECK (objetivo IN ('fuerza','resistencia','perder_peso','ganar_masa')),
      foto_url TEXT,
      actualizado_en TIMESTAMP DEFAULT NOW(),
      CONSTRAINT uk_perfiles_usuario UNIQUE (usuario_id)
    );
  `);
};

module.exports = initDatabase;
