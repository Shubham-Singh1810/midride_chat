const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const { fetchEmails } = require("../utils/emailService");
const emailController = express.Router();

const crypto = require("crypto");

const getGravatarUrl = (email) => {
  const emailHash = crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex");
  return `https://www.gravatar.com/avatar/${emailHash}?d=identicon`;
};

emailController.get("/list", async (req, res) => {
  try {
    const emails = await fetchEmails();

    const parsedEmails = emails.map((email) => {
      const headers = email.raw
        .split("\r\n")
        .reduce((acc, line) => {
          const [key, value] = line.split(": ");
          if (key && value) acc[key.toLowerCase()] = value;
          return acc;
        }, {});

      const senderEmail = headers.from ? headers.from.match(/<(.+)>/)?.[1] : null;

      // Extract plain text and HTML content
      let plainText = null;
      let htmlText = null;

      if (email.attributes?.struct) {
        const extractContent = (parts) => {
          for (const part of parts) {
            if (part.type === "text" && part.subtype === "plain") {
              plainText = part.body || plainText;
            } else if (part.type === "text" && part.subtype === "html") {
              htmlText = part.body || htmlText;
            } else if (Array.isArray(part)) {
              extractContent(part); // Handle nested parts
            }
          }
        };
        extractContent(email.attributes.struct);
      }

      return {
        date: headers.date || email.attributes.date,
        from: headers.from || "Unknown Sender",
        to: headers.to || "Unknown Recipient",
        subject: headers.subject || "No Subject",
        flags: email.attributes.flags || [],
        uid: email.attributes.uid,
        profilePicUrl: senderEmail ? getGravatarUrl(senderEmail) : null,
        content: {
          plainText: plainText || "No plain text content available",
          htmlText: htmlText || "No HTML content available",
        },
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
