const { supabase } = require("../subapaseClient");

const logProgress = async (req, res) => {
  try {
    const { fecha, tipo_medida, valor, ejercicio_nombre } = req.body;
    const usuario_id = req.user.id;

    if (!fecha || !tipo_medida || !valor) {
        return res.status(400).json({ success: false, message: "fecha, tipo_medida, y valor son requeridos."});
    }

    const { data, error } = await supabase
      .from("progreso")
      .insert([
        { usuario_id, fecha, tipo_medida, valor, ejercicio_nombre },
      ])
      .select();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data: data[0],
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getProgress = async (req, res) => {
  try {
    const usuario_id = req.user.id;

    const { data, error } = await supabase
      .from("progreso")
      .select("*")
      .eq("usuario_id", usuario_id)
      .order("fecha", { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  logProgress,
  getProgress,
};
