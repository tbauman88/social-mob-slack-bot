// @ts-check
const fetch = require('node-fetch').default;
const { CHANNEL, TOKEN } = process.env;
const helpers = require('../helpers.js');


exports.handler = async function (event, context, callback) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 503,
      body: 'Unsupported Request Method'
    };
  }
  const session = JSON.parse(event.body.trim());
  callback(null, { statusCode: 204, body: 'Success' });

  const attendees = session.attendee_limit != null ? `${session.attendee_limit} attendees available` : 'Unlmited attendees available'

  try {
    fetch(
      `https://${process.env.NAME}.netlify.app/.netlify/functions/session-scheduler`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: session.id,
          title: session.title,
          time: helpers.convertTime12to24(session.date, session.start_time),
          attendees: [session.owner.name, ...session.attendees.map(({ name }) => name)]
        })
      }
    )

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: CHANNEL,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: session.title,
              emoji: true
            }
          },
          {
            type: "section",
            block_id: `${session.id}`,
            text: {
              type: "mrkdwn",
              text: `Hosted by: \n ${session.owner.name} \n ${session.start_time} - ${session.end_time} \n ${attendees}`
            },
            "accessory": {
              type: "image",
              "image_url": session.owner.avatar,
              "alt_text": session.owner.name
            }
          },
          {
            type: "context",
            "elements": [
              {
                type: "plain_text",
                text: session.topic,
                emoji: true
              }
            ]
          },
          {
            type: "section",
            text: {
              type: "plain_text",
              text: `:round_pushpin: ${session.location}`
            },
            "accessory": {
              type: "button",
              text: {
                type: "plain_text",
                text: "Join Growth Session",
              },
              "value": "click_me_123",
              "url": `https://growth.vehikl.com/growth_sessions/${session.id}`,
              "action_id": "button-action"
            }
          },
          {
            type: "divider"
          }
        ]
      })
    });

    if (!res.ok) throw new Error(res.statusText);
  } catch (e) {
    callback(null, { statusCode: 500, body: 'Internal Server Error: ' + e });
  }
};
