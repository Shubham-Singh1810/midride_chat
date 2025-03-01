const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const { fetchEmails, markEmailAsRead } = require("../utils/emailService");
const emailController = express.Router();

const crypto = require("crypto");

const getGravatarUrl = (email) => {
  const emailHash = crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex");
  return `https://www.gravatar.com/avatar/${emailHash}?d=identicon`;
};
emailController.post("/list", async (req, res) => {
  try {
    const { page = 1, limit = 10, searchKey = "", sinceDate = null } = req.body;

    const emails = await fetchEmails(page, limit, searchKey, sinceDate);

    sendResponse(res, 200, "Success", {
      success: true,
      message: "Unread emails retrieved successfully",
      currentPage: page,
      totalPages: Math.ceil(emails.length / limit),
      totalRecords: emails.length,
      data: emails,
    });
  } catch (error) {
    sendResponse(res, 500, "Failed", {
      success: false,
      message: error.message || "Internal server error",
    });
  }
});
emailController.post("/mark-as-read", async (req, res) => {
  try {
    const { emailUID } = req.body; // IMAP UID of the email

    if (!emailUID) {
      return sendResponse(res, 400, "Failed", {
        success: false,
        message: "Email UID is required",
      });
    }

    const result = await markEmailAsRead(emailUID);

    if (result.success) {
      sendResponse(res, 200, "Success", {
        success: true,
        message: "Email marked as read successfully",
      });
    } else {
      sendResponse(res, 500, "Failed", {
        success: false,
        message: result.message || "Failed to mark email as read",
      });
    }
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      success: false,
      message: error.message || "Internal server error",
    });
  }
});




module.exports = emailController;
