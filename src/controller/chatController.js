const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
const Chat = require("../model/chat.Schema");
const chatController = express.Router();

chatController.post("/create-chat", async (req, res) => {
    try { 
      const chat = await Chat.create(req.body);
      sendResponse(res, 200, "Success", {
        success: true,
        message: "Message created successfully",
        data: chat,
      });
    } catch (error) {
      console.log(error);
      sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error",
      });
    }
});

chatController.post("/get-booking-chat", async (req, res) => {
  try { 
    const chat = await Chat.find({bookingId: req.body.bookingId});
    sendResponse(res, 200, "Success", {
      success: true,
      message: "Message retrieved successfully",
      data: chat,
    });
  } catch (error) {
    console.log(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

module.exports = chatController;
