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
emailController.post("/list", async (req, res) => {
  try {
    const { page = 1, limit = 10, searchKey = "" } = req.body;

    // Fetch all emails
    let emails = await fetchEmails();

    // Apply search filter
    if (searchKey) {
      const searchLower = searchKey.toLowerCase();
      emails = emails.filter(
        (email) =>
          email.fullName.toLowerCase().includes(searchLower) ||
          email.email.toLowerCase().includes(searchLower) ||
          email.subject.toLowerCase().includes(searchLower)
      );
    }

    // Implement pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + Number(limit);
    const paginatedEmails = emails.slice(startIndex, endIndex);

    // Parse emails
    const parsedEmails = paginatedEmails.map((email) => ({
      date: email.date,
      fullName: email.fullName,
      email: email.email,
      subject: email.subject,
      subjectText: email.subjectText,
      textContent: email.text,
      htmlContent: email.html,
      attachments: email.attachments.map((attachment) => ({
        filename: attachment.filename,
        contentType: attachment.contentType,
        size: attachment.size,
        url: `data:${attachment.contentType};base64,${attachment.content}`, // Embed as Base64 URL
      })),
    }));

    sendResponse(res, 200, "Success", {
      success: true,
      message: "Emails retrieved successfully",
      currentPage: page,
      totalPages: Math.ceil(emails.length / limit),
      totalRecords: emails.length,
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
