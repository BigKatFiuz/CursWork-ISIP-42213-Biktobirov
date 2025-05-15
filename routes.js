const express = require("express");
const router = express.Router();

let users = []; 
router.post("/register", (req, res) => {
  const { username, password } = req.body;

  // Простейшая проверка
  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Введите логин и пароль" });
  }

  // Проверяем, существует ли пользователь
  const existingUser = users.find((u) => u.username === username);
  if (existingUser) {
    return res
      .status(400)
      .json({ success: false, message: "Пользователь уже существует" });
  }

  // Сохраняем пользователя 
  users.push({ username, password, score1: 0, score2: 0 });
  console.log("Новый пользователь зарегистрирован:", username);
  res.json({ success: true, message: "Регистрация успешна" });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Ищем пользователя по имени и паролю
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: "Неверный логин или пароль" });
  }

  console.log("Пользователь вошел в систему:", username);
  res.json({ success: true, message: "Вход выполнен" });
});

router.post("/saveScore", (req, res) => {
  const { player, score } = req.body;

  console.log(`Сохранение счёта: игрок ${player}, счёт ${score}`);

  res.status(200).send("Счет сохранён");
});

module.exports = router;