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
const upload = require("../utils/multer");

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

chatController.post("/create-chat", upload.single("image"), async (req, res) => {
  try {
    let chatData = {...req.body};
    if (req.file) {
      let image = await cloudinary.uploader.upload(req.file.path, function (err, result) {
        if (err) {
          return err;
        } else {
          chatData.image = result.url;
          return result;
        }
      });
      
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

chatController.post("/get-unread-message-count", async (req, res) => {
  try {
    const { bookingIds } = req.body;

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      return sendResponse(res, 400, "Failed", {
        success: false,
        message: "Invalid or empty bookingIds",
      });
    }

    // Fetch unread message counts for each bookingId
    const messageCounts = await Promise.all(
      bookingIds.map(async (bookingId) => {
        const unReadMessageCount = await Chat.countDocuments({
          bookingId,
          isRead: false,
        });
        return { bookingId, unReadMessageCount };
      })
    );

    sendResponse(res, 200, "Success", {
      success: true,
      message: "Message retrieved successfully",
      data: messageCounts,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      success: false,
      message: error.message || "Internal server error",
    });
  }
});


module.exports = chatController;
