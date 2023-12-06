// @ts-check
const fetch = require("node-fetch").default;
const helpers = require("../helpers.js");
const { TOKEN, CHANNEL } = process.env;

exports.handler = async function (event, context, callback) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 503, body: "Unsupported Request Method" };
  }

  try {
    const session = JSON.parse(event.body);
    const attendees = await helpers.getMobAttendees(session.attendees);

    // const res = await fetch("https://slack.com/api/chat.scheduleMessage", {
    //   method: "POST",
    //   headers: {
    //     Authorization: `Bearer ${TOKEN}`,
    //     "Content-Type": "application/json"
    //   },
    //   body: JSON.stringify({
    //     channel: CHANNEL,
    //     text: `This is a reminder *_${session.title}_* growth session is starting now! ${attendees}`,
    //     post_at: session.time
    //   })
    // });

    callback(null, { statusCode: 204, body: "Success" });
  } catch (e) {
    callback(null, { statusCode: 500, body: "Internal Server Error: " + e });
  }
};
