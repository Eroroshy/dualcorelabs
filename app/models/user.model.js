const pool = require("../config/db");

const findByEmail = async (email) => {

  return await pool.query(
    `
    SELECT *
    FROM usuarios
    WHERE email = $1
    `,
    [email]
  );

};

const createUser = async (
  nombre,
  email,
  passwordHash
) => {

  return await pool.query(
    `
    INSERT INTO usuarios
    (
      nombre,
      email,
      password_hash
    )
    VALUES
    (
      $1,
      $2,
      $3
    )
    RETURNING *
    `,
    [nombre, email, passwordHash]
  );

};

const updateNameById = async (id, nombre) => {
  return await pool.query(
    `
    UPDATE usuarios
    SET nombre = $1
    WHERE id = $2
    RETURNING id, nombre, email, fecha_registro
    `,
    [nombre, id]
  );
};

module.exports = {
  findByEmail,
  createUser,
  updateNameById,
};