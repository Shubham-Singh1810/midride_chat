const express = require("express");
const router = express.Router();
const chatController = require("./controller/chatController");
const emailController = require("./controller/emailController");

router.use("/chat", chatController);
router.use("/email", emailController);

module.exports = router;