require("dotenv").config();
const app = require("./app/backend");

app.listen(process.env.PORT || 3000, () => {
  console.log(`Servidor iniciado en puerto ${process.env.PORT || 3000}`);
});