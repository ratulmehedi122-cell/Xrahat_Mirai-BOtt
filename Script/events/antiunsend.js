const fs = require("fs");

module.exports.config = {
    name: "antiUnsend",
    eventType: ["message", "message_unsend"],
    version: "1.0.0",
    credits: "Hasan",
    description: "Show unsent messages instantly"
};

// মেসেজ সেভ করার সিস্টেম
module.exports.run = async function ({ event }) {
    const { messageID, senderID, body, attachments } = event;

    const path = __dirname + "/cache/unsendData.json";
    if (!fs.existsSync(path)) fs.writeFileSync(path, "{}");

    const data = JSON.parse(fs.readFileSync(path));

    data[messageID] = {
        senderID,
        body: body || "",
        attachments
    };

    fs.writeFileSync(path, JSON.stringify(data, null, 4));
};

// যখন কেউ unsend করবে
module.exports.handleEvent = async function ({ api, event }) {
    if (event.type !== "message_unsend") return;

    const path = __dirname + "/cache/unsendData.json";
    if (!fs.existsSync(path)) return;

    const data = JSON.parse(fs.readFileSync(path));
    const old = data[event.messageID];

    if (!old) return;

    let msg = `❗ Someone unsent a message!
👤 UID: ${old.senderID}
💬 Message: ${old.body || "(empty)"}`;

    // যদি attachment থাকে
    if (old.attachments && old.attachments.length > 0) {
        let attFiles = [];

        for (let file of old.attachments) {
            const tempPath = __dirname + `/cache/${file.filename || Date.now()}`;
            fs.writeFileSync(tempPath, Buffer.from(file.data, "base64"));
            attFiles.push(fs.createReadStream(tempPath));
        }

        return api.sendMessage(
            { body: msg, attachment: attFiles },
            event.threadID
        );
    }

    return api.sendMessage(msg, event.threadID);
};
