const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const { fetchEmails } = require("../utils/emailService");
const emailController = express.Router();

emailController.get("/list", async (req, res) => {
     try {
        const emails = await fetchEmails();
        sendResponse(res, 200, "Success", {
          success: true,
          message: "Message retrieved successfully",
          data: emails,
        });
      } catch (error) {
        console.log(error);
        sendResponse(res, 500, "Failed", {
          message: error.message || "Internal server error",
        });
      }
});



module.exports = emailController;
