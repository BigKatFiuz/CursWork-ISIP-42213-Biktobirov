const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path"); 
const routes = require("./routes");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.use("/api", routes);

app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});