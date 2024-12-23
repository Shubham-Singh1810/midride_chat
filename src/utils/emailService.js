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


        // Fetch the latest 50 emails (modify the search query if necessary)
        const fetchLimit = 50;

        imap.search(["ALL"], function (err, results) {
          if (err) return reject(err);

          // Limit to the latest 50 emails
          const limitedResults = results.slice(-fetchLimit);


          const fetch = imap.fetch(limitedResults, { bodies: "" });

          const emails = [];

          fetch.on("message", function (msg, seqno) {
            let emailContent = "";

            msg.on("body", function (stream) {
              stream.on("data", function (chunk) {
                emailContent += chunk.toString("utf8");
              });
            });

            msg.once("end", async function () {
              try {
                const parsed = await simpleParser(emailContent); // Parse email using mailparser

                // Extract sender information
                const senderName = parsed.from?.text || "Unknown Sender";
                const senderEmail = parsed.from?.value[0]?.address || "Unknown Email";
                const nameParts = senderName.split("<");
                const fullName = nameParts[0] ? nameParts[0].slice(1, -2) : "Unknown";

                // Create the email object
                const formObject = {
                  fullName,
                  email: senderEmail,
                  date: parsed.date,
                  subject: parsed.subject.split(":")[0] || "No Subject",
                  subjectText: parsed.subject.split(":")[1] || "No Subject",
                  text: parsed.text || "No plain text content available",
                  html: parsed.html || "No HTML content available",
                  attachments: parsed.attachments.map((attachment) => ({
                    filename: attachment.filename,
                    contentType: attachment.contentType,
                    size: attachment.size,
                    content: attachment.content.toString("base64"), // Base64 encode for sending
                  })),
                };

                emails.push(formObject);
              } catch (parseErr) {
                console.error("Email parse error:", parseErr);
              }
            });
          });

          fetch.once("error", function (err) {
            console.error("Fetch error:", err);
            reject(err);
          });

          fetch.once("end", function () {
            imap.end();

            // Sort emails in descending order (latest first)
            emails.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Log the number of emails returned
            console.log("Emails fetched:", emails.length);

            resolve(emails); // Return the latest 50 emails
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
