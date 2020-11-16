// @ts-check
const fetch = require('node-fetch').default;
const { CHANNEL, NAME, TOKEN } = process.env;
import { convertTime12to24,  getSessions } from '../helpers'

exports.handler = async function (event, context, callback) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 503, body: 'Unsupported Request Method' };
  }

  callback(null, { statusCode: 204, body: 'Success' });

  try {
    const sessions = await getSessions();
    const headers = {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    };

    if (sessions.length === 0) {
      return fetch(`https://slack.com/api/chat.postMessage`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          channel: CHANNEL,
          text: `Nothing is scheduled for today. <https://growth.vehikl.com/| _*Be Better*_ >`
        })
      });
    }

    if (sessions.length > 0) {
      sessions.forEach(({ attendees, date, id, owner, start_time, title }) => {
        fetch(`https://${NAME}.netlify.app/.netlify/functions/mob-scheduler`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            title,
            time: convertTime12to24(date, start_time),
            attendees: [owner.name, ...attendees.map(({ name }) => name)]
          })
        });
      });
    }

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        channel: CHANNEL,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*_Colin_*: Lets talk growth, what do we have today Margo? \n *_Margo_*: Great question Colin!`
            }
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: ':boom: Growth sessions happening today: :boom:' }
          },
          { type: 'divider' },
          ...sessions.map(({
            id, title, start_time, end_time, attendees, attendee_limit, location, owner
          }) => ({
            type: 'section',
            block_id: `${id}`,
            text: {
              type: 'mrkdwn',
              text: `:bulb: <https://growth.vehikl.com/social_mobs/${id}| ${title}>  \n :watch: ${start_time} - ${end_time} \n :busts_in_silhouette:  ${attendees.length}/${attendee_limit || '–'} Attendees \n :round_pushpin: ${location}`
            },
            accessory: {
              type: 'image',
              image_url: owner.avatar,
              alt_text: owner.name
            }
          }))
        ]
      })
    });

    if (!res.ok) throw new Error(res.statusText);
  } catch (e) {
    callback(null, { statusCode: 500, body: 'Internal Server Error: ' + e });
  }
};
