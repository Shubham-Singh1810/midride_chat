const Imap = require("imap");
const { simpleParser } = require("mailparser");

const imapConfig = {
  user: "pay@mieride.ca",
  password: "Hi12348765@",
  host: "imap.hostinger.com",
  port: 993,
  tls: true,
};

const fetchEmails = (page = 1, limit = 10, searchKey = "", sinceDate = null) => {
  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);

    imap.once("ready", function () {
      imap.openBox("INBOX", true, function (err, box) {
        if (err) return reject(err);

        // Create search filter
        let searchCriteria = ["UNSEEN"]; // Fetch only unread emails

        if (sinceDate) {
          const dateObj = new Date(sinceDate + "T00:00:00Z"); // Ensure UTC
          const day = String(dateObj.getDate()).padStart(2, "0");
          const month = dateObj.toLocaleString("en-US", { month: "short" });
          const year = dateObj.getFullYear();
          const formattedDate = `${day}-${month}-${year}`; // Correct format for IMAP

          searchCriteria.push(["SINCE", formattedDate]); // ✅ Corrected format
        }

        imap.search(searchCriteria, function (err, results) {
          if (err) return reject(err);
          if (!results || results.length === 0) return resolve([]);

          // Sort results in descending order (latest first)
          results = results.sort((a, b) => b - a);

          // Apply pagination before fetching
          const startIndex = (page - 1) * limit;
          const paginatedResults = results.slice(startIndex, startIndex + limit);

          const fetch = imap.fetch(paginatedResults, { bodies: "", struct: true });
          const emailPromises = [];

          fetch.on("message", function (msg) {
            emailPromises.push(
              new Promise((resolveEmail, rejectEmail) => {
                let emailContent = "";
                let emailUID = null; // ✅ Define email UID

                // ✅ Fetch UID correctly
                msg.on("attributes", function (attrs) {
                  emailUID = attrs.uid; // Assign UID
                });

                msg.on("body", function (stream) {
                  stream.on("data", function (chunk) {
                    emailContent += chunk.toString("utf8");
                  });
                });

                msg.once("end", async function () {
                  try {
                    const parsed = await simpleParser(emailContent);
                    const senderName = parsed.from?.text || "Unknown Sender";
                    const senderEmail = parsed.from?.value[0]?.address || "Unknown Email";
                    const nameParts = senderName.split("<");
                    const fullName = nameParts[0] ? nameParts[0].slice(1, -2) : "Unknown";

                    if (
                      searchKey &&
                      !fullName.toLowerCase().includes(searchKey.toLowerCase()) &&
                      !senderEmail.toLowerCase().includes(searchKey.toLowerCase()) &&
                      !parsed.subject.toLowerCase().includes(searchKey.toLowerCase())
                    ) {
                      return resolveEmail(null); // Skip this email if it doesn't match searchKey
                    }

                    resolveEmail({
                      uid: emailUID, // ✅ UID now correctly assigned
                      fullName,
                      email: senderEmail,
                      date: parsed.date || new Date(0),
                      subject: parsed.subject || "No Subject",
                      text: parsed.text || "No plain text content available",
                      html: parsed.html || "No HTML content available",
                      attachments: parsed.attachments.map((att) => ({
                        filename: att.filename,
                        contentType: att.contentType,
                        size: att.size,
                        content: att.content.toString("base64"),
                      })),
                    });
                  } catch (parseErr) {
                    rejectEmail(parseErr);
                  }
                });
              })
            );
          });

          fetch.once("error", function (err) {
            reject(err);
          });

          fetch.once("end", async function () {
            imap.end();
            try {
              let emails = await Promise.all(emailPromises);
              emails = emails.filter((email) => email !== null); // Remove null values from unmatched searches
              resolve(emails);
            } catch (err) {
              reject(err);
            }
          });
        });
      });
    });

    imap.once("error", function (err) {
      reject(err);
    });

    imap.connect();
  });
};
const markEmailAsRead = (emailUID) => {
  return new Promise((resolve, reject) => {
    console.log("📩 Connecting to IMAP to mark email as read:", emailUID);

    const imap = new Imap(imapConfig);

    imap.once("ready", function () {
      console.log("✅ IMAP connection successful!");

      imap.openBox("INBOX", false, function (err, box) {
        if (err) {
          console.log("❌ Error opening INBOX:", err.message);
          return reject({ success: false, message: err.message });
        }

        console.log(`📬 Marking email UID ${emailUID} as read...`);
        imap.addFlags(emailUID, "\\Seen", function (err) {
          if (err) {
            console.log("❌ Error adding \\Seen flag:", err.message);
            return reject({ success: false, message: err.message });
          }

          console.log(`✅ Email ${emailUID} marked as read.`);
          imap.end();
          resolve({ success: true });
        });
      });
    });

    imap.once("error", function (err) {
      console.log("❌ IMAP Connection Error:", err.message);
      reject({ success: false, message: err.message });
    });

    imap.connect();
  });
};


module.exports = { fetchEmails, markEmailAsRead };
