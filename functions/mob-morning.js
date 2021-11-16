// @ts-check
const fetch = require('node-fetch').default;
const helpers = require('../helpers.js');
const { CHANNEL, NAME, TOKEN } = process.env;

exports.handler = async function (event, context, callback) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 503, body: 'Unsupported Request Method' };
  }

  callback(null, { statusCode: 204, body: 'Success' });

  try {
    const sessions = await helpers.getMorningSessions();
    const headers = {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    };

    if (sessions.length === 0) return

    if (sessions.length > 0) {
      sessions.forEach(({ attendees, date, id, owner, start_time, title }) => {
        fetch(`https://${NAME}.netlify.app/.netlify/functions/mob-scheduler`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            title,
            time: helpers.convertTime12to24(date, start_time),
            attendees: attendees.map(({ name }) => name)
          })
        });
      });
    }

    const blocks = sessions.map(({ id, title, start_time, end_time, attendees, attendee_limit, location, owner, topic }) => {
      const people = attendee_limit != null ? `${attendees.length}/${attendee_limit} Attendees` : 'Unlimited attendees available'

      return ([
        {
          type: "header",
          text: {
            type: "plain_text",
            text: title,
            emoji: true
          }
        },
        {
          type: "section",
          block_id: `${id}`,
          text: {
            type: "mrkdwn",
            text: `Hosted by: \n ${owner.name} \n ${start_time} - ${end_time} \n ${people}`
          },
          "accessory": {
            type: "image",
            "image_url": owner.avatar,
            "alt_text": owner.name
          }
        },
        {
          type: "context",
          "elements": [
            {
              type: "plain_text",
              text: topic,
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "plain_text",
            text: `:round_pushpin: ${location}`
          },
          "accessory": {
            type: "button",
            text: {
              type: "plain_text",
              text: "Join Growth Session",
            },
            "value": "click_me_123",
            "url": `https://growth.vehikl.com/growth_sessions/${id}`,
            "action_id": "button-action"
          }
        },
        {
          type: "divider"
        }
      ])
    })

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers,
      body: JSON.stringify({ channel: CHANNEL, blocks: blocks.flat(1)  })
    });

    if (!res.ok) throw new Error(res.statusText);
  } catch (e) {
    callback(null, { statusCode: 500, body: 'Internal Server Error: ' + e });
  }
};
