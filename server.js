require("dotenv").config();

const app = require("./app/backend");
const pool = require("./app/config/db");
const initDatabase = require("./app/config/init-db");

pool.query("SELECT 1")
  .then(() => initDatabase())
  .then(() => {
    console.log("PostgreSQL conectado");

    app.listen(process.env.PORT, () => {
      console.log(`Servidor iniciado en puerto ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error al conectar con PostgreSQL:", error);
    process.exit(1);
  });
