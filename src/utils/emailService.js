const Imap = require("imap");
const { simpleParser } = require("mailparser");

const imapConfig = {
  user: "pay@mieride.ca",
  password: "Hi12348765@",
  host: "imap.hostinger.com",
  port: 993,
  tls: true,
};

const fetchEmails = () => {
  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);

    imap.once("ready", function () {
      imap.openBox("INBOX", true, function (err, box) {
        if (err) return reject(err);

        // Fetch emails in a consistent order (use UID)
        imap.search(["ALL"], function (err, results) {
          if (err) return reject(err);

          if (!results || results.length === 0) {
            console.log("No emails found!");
            return resolve([]);
          }

          // Fetch the latest 50 emails in ascending UID order
          const fetchLimit = 50;
          const limitedResults = results.slice(-fetchLimit);

          const fetch = imap.fetch(limitedResults, { bodies: "", struct: true });

          // Use an array to store parsed emails
          const emailPromises = [];

          fetch.on("message", function (msg, seqno) {
            emailPromises.push(
              new Promise((resolveEmail, rejectEmail) => {
                let emailContent = "";

                msg.on("body", function (stream) {
                  stream.on("data", function (chunk) {
                    emailContent += chunk.toString("utf8");
                  });
                });

                msg.once("end", async function () {
                  try {
                    const parsed = await simpleParser(emailContent);

                    // Extract sender information
                    const senderName = parsed.from?.text || "Unknown Sender";
                    const senderEmail =
                      parsed.from?.value[0]?.address || "Unknown Email";
                    const nameParts = senderName.split("<");
                    const fullName =
                      nameParts[0] ? nameParts[0].slice(1, -2) : "Unknown";

                    // Create the email object
                    const formObject = {
                      fullName,
                      email: senderEmail,
                      date: parsed.date || new Date(0), // Use default date if missing
                      subject: parsed.subject?.split(":")[0] || "No Subject",
                      subjectText: parsed.subject?.split(":")[1] || "No Subject",
                      text: parsed.text || "No plain text content available",
                      html: parsed.html || "No HTML content available",
                      attachments: parsed.attachments.map((attachment) => ({
                        filename: attachment.filename,
                        contentType: attachment.contentType,
                        size: attachment.size,
                        content: attachment.content.toString("base64"), // Base64 encode for sending
                      })),
                    };

                    resolveEmail(formObject);
                  } catch (parseErr) {
                    console.error("Email parse error:", parseErr);
                    rejectEmail(parseErr);
                  }
                });
              })
            );
          });

          fetch.once("error", function (err) {
            console.error("Fetch error:", err);
            reject(err);
          });

          fetch.once("end", async function () {
            imap.end();

            try {
              // Wait for all emails to finish parsing
              const emails = await Promise.all(emailPromises);

              // Sort emails by date (newest first) to ensure consistency
              emails.sort((a, b) => new Date(b.date) - new Date(a.date));

              resolve(emails);
            } catch (err) {
              console.error("Error resolving email promises:", err);
              reject(err);
            }
          });
        });
      });
    });

    imap.once("error", function (err) {
      console.error("IMAP Error:", err);
      reject(err);
    });

    imap.connect();
  });
};

module.exports = { fetchEmails };
