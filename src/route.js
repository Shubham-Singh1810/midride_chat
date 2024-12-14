const express = require("express");
const router = express.Router();
const chatController = require("./controller/chatController");

router.use("/chat", chatController);

module.exports = router;