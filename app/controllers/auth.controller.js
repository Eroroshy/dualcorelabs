const { supabase } = require("../subapaseClient");

const me = async (req, res) => {
  try {
    // The user object is attached by the updated Supabase auth middleware.
    // We just need to fetch the associated profile data from our public 'perfiles' table.
    const { user } = req;

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const { data: profile, error: profileError } = await supabase
      .from("perfiles")
      .select("*")
      .eq("usuario_id", user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw profileError;
    }

    // Combine Supabase auth user with our public profile data
    const userWithProfile = {
      ...user,
      profile: profile,
    };

    res.json(userWithProfile);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const register = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ message: "Nombre, email y password son requeridos" });
    }

    // Sign up the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        // Store extra data like name
        data: {
          nombre: nombre,
        },
      },
    });

    if (authError) {
      return res.status(400).json({ success: false, message: authError.message });
    }
    
    if (!authData.user) {
        return res.status(500).json({ success: false, message: "No se pudo crear el usuario." });
    }

    // After successful signup, create a profile for the user in the 'perfiles' table
    const { error: profileError } = await supabase
      .from("perfiles")
      .insert({
        usuario_id: authData.user.id,
      });

    if (profileError) {
      // Best effort: log the error but the user was already created.
      console.error("Error creating user profile:", profileError.message);
    }

    res.status(201).json({
      success: true,
      ...authData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email y password son requeridos" });
    }

    const { data: sessionData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return res.status(401).json({ success: false, message: authError.message });
    }

    if (!sessionData.user) {
        return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    
    // Fetch profile to return complete user object
    const { data: profile, error: profileError } = await supabase
      .from("perfiles")
      .select("*")
      .eq("usuario_id", sessionData.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    res.json({
        success: true,
        session: sessionData.session,
        user: { ...sessionData.user, profile }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  me
};