const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Chat = require("../model/chat.Schema");
const chatController = express.Router();
const OneSignal = require("onesignal-node");
const cloudinary = require("../utils/cloudinary");
const client = new OneSignal.Client(process.env.ONESIGNAL_APP_ID, process.env.ONESIGNAL_REST_API_KEY);
const axios = require("axios"); // Import axios for making HTTP requests
const { isReadable } = require("stream");

const sendPushNotification = async (bookingId, deviceId, message) => {
  console.log(process.env.ONESIGNAL_USER_APP_ID, process.env.ONESIGNAL_USER_REST_API_KEY)
 
  try {
    const payload = {
      app_id: process.env.ONESIGNAL_USER_APP_ID, 
      include_player_ids: [deviceId], 
      contents: { en: message }, 
    };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Basic ${process.env.ONESIGNAL_USER_REST_API_KEY}`,
    };

    const response = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      payload,
      { headers }
    );

    console.log("Notification sent successfully:", response.data);
  } catch (error) {
    console.error(
      "Error sending push notification:",
      error.response ? error.response.data : error.message
    );
  }
};

chatController.post("/create-chat", async (req, res) => {
  try {
    let chatData;
    if (req.file) {
      let image = await cloudinary.uploader.upload(req.file.path, function (err, result) {
        if (err) {
          return err;
        } else {
          return result;
        }
      });
      if(req?.body?.image){
       chatData = { ...req.body, image: image.url };
      }
      if(req?.body?.voice){
        chatData = { ...req.body, voice: image.url };
      }
    }
    const chat = await Chat.create(chatData);
    req.io.emit("new-message", chat); // Broadcast the message
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
    const chat = await Chat.find({ bookingId: req.body.bookingId }).sort({ createdAt: 1 });
    // Emit an event to notify the client of the retrieved chat
    req.io.emit("chat-history", { bookingId: req.body.bookingId, messages: chat });
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

chatController.post("/update-chat", async (req, res) => {
  try {
   const chat = await Chat.updateOne({ _id: req.body._id }, {isRead:true}, { new: true });
    sendResponse(res, 200, "Success", {
      success: true,
      message: "Marked read successfully",
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
