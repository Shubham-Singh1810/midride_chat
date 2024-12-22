const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const { fetchEmails } = require("../utils/emailService");
const emailController = express.Router();

emailController.get("/list", async (req, res) => {
  try {
    const emails = await fetchEmails();

    // Parse and structure the emails
    const parsedEmails = emails.map((email) => {
      const headers = email.raw
        .split("\r\n")
        .reduce((acc, line) => {
          const [key, value] = line.split(": ");
          if (key && value) acc[key.toLowerCase()] = value;
          return acc;
        }, {});

      return {
        date: headers.date || email.attributes.date,
        from: headers.from || "Unknown Sender",
        to: headers.to || "Unknown Recipient",
        subject: headers.subject || "No Subject",
        flags: email.attributes.flags || [],
        uid: email.attributes.uid,
      };
    });

    sendResponse(res, 200, "Success", {
      success: true,
      message: "Emails retrieved successfully",
      data: parsedEmails,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      success: false,
      message: error.message || "Internal server error",
    });
  }
});




module.exports = emailController;
