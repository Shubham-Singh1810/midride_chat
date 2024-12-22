const Imap = require("imap");

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

        // Search for emails since a specific date
        imap.search(["ALL", ["SINCE", "01-Dec-2024"]], function (err, results) {
          if (err) return reject(err);

          const limitedResults = results.slice(0, 50); // Fetch first 50 emails
          const fetch = imap.fetch(limitedResults, {
            bodies: ["HEADER.FIELDS (FROM TO SUBJECT DATE)"],
            struct: true,
          });

          const emails = [];

          fetch.on("message", function (msg, seqno) {
            const email = {};
            msg.on("body", function (stream) {
              let buffer = "";
              stream.on("data", function (chunk) {
                buffer += chunk.toString("utf8");
              });
              stream.once("end", function () {
                email.raw = buffer;
              });
            });
            msg.once("attributes", function (attrs) {
              email.attributes = attrs;
            });
            msg.once("end", function () {
              emails.push(email);
            });
          });

          fetch.once("error", function (err) {
            console.error("Fetch error:", err);
            reject(err);
          });

          fetch.once("end", function () {
            imap.end();
            resolve(emails);
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
