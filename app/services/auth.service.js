const User = require("../models/user.model");
const Profile = require("../models/profile.model");

const {
  hashPassword,
  comparePassword
} = require("../utils/bcrypt");

const {
  generateToken
} = require("../utils/jwt");

const register = async (
  nombre,
  email,
  password
) => {
  const existing = await User.findByEmail(email);

  if (existing.rows.length > 0) {
    throw new Error("Email already exists");
  }

  const hash = await hashPassword(password);
  const userResult = await User.createUser(nombre, email, hash);
  const user = userResult.rows[0];
  const profileResult = await Profile.createProfile(user.id);
  const profile = profileResult.rows[0];

  const { password_hash, ...userData } = user;

  return {
    ...userData,
    profile
  };
};

const login = async (
  email,
  password
) => {
  const result = await User.findByEmail(email);

  if (result.rows.length === 0) {
    throw new Error("User not found");
  }

  const user = result.rows[0];
  const valid = await comparePassword(password, user.password_hash);

  if (!valid) {
    throw new Error("Invalid password");
  }

  const profileResult = await Profile.findByUsuarioId(user.id);
  const profile = profileResult.rows[0] || null;

  const { password_hash, ...userData } = user;
  const token = generateToken(user);

  return {
    token,
    user: {
      ...userData,
      profile
    }
  };
};

module.exports = {
  register,
  login
};