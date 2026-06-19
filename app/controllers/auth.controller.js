const authService = require("../services/auth.service");
const pool = require("../config/db");

const me = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        u.id,
        u.nombre,
        u.email,
        u.fecha_registro,
        p.id AS profile_id,
        p.edad,
        p.peso_kg,
        p.altura_cm,
        p.nivel_experiencia,
        p.objetivo,
        p.foto_url,
        p.actualizado_en
      FROM usuarios u
      LEFT JOIN perfiles p ON u.id = p.usuario_id
      WHERE u.id = $1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }

    const row = result.rows[0];
    const user = {
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      fecha_registro: row.fecha_registro,
      profile: row.profile_id
        ? {
            id: row.profile_id,
            edad: row.edad,
            peso_kg: row.peso_kg,
            altura_cm: row.altura_cm,
            nivel_experiencia: row.nivel_experiencia,
            objetivo: row.objetivo,
            foto_url: row.foto_url,
            actualizado_en: row.actualizado_en,
          }
        : null,
    };

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const register =
async (req,res)=>{

  try{

    const {
      nombre,
      email,
      password
    } = req.body;

    const user =
    await authService.register(
      nombre,
      email,
      password
    );

    res.status(201).json({
      success:true,
      user
    });

  }
  catch(error){

    res.status(400).json({
      success:false,
      message:error.message
    });

  }

};

const login =
async (req,res)=>{

  try{

    const {
      email,
      password
    } = req.body;

    const result =
    await authService.login(
      email,
      password
    );

    res.json(result);

  }
  catch(error){

    res.status(401).json({
      success:false,
      message:error.message
    });

  }

};

module.exports = {
  register,
  login,
  me
};