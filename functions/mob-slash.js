// @ts-check
const fetch = require('node-fetch').default;
const { TOKEN } = process.env;
import {  getSessions } from '../helpers'

exports.handler = async function (event, context, callback) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 503, body: 'Unsupported Request Method'};
  }

  callback(null, { statusCode: 204, body: 'Success' });
  try {
    const sessions = await getSessions();
    const parsed = new URLSearchParams(event.body);
    const user = parsed.get('user_id');
    const channel = parsed.get('channel_id');

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `:boom: *<@${user}>* is wondering what _sessions_ are happening today :boom:`
            }
          },
          { type: 'divider' },
          ...sessions.map((session) => {
            return {
              type: 'section',
              block_id: `${session.id}`,
              text: {
                type: 'mrkdwn',
                text: `:bulb: ${session.title} \n :watch: ${session.start_time} - ${session.end_time} \n :busts_in_silhouette:  (${session.attendees.length}) Attendees \n :round_pushpin: ${session.location}`
              },
              accessory: {
                type: 'image',
                image_url: session.owner.avatar,
                alt_text: session.owner.name
              }
            };
          })
        ]
      })
    });

    if (!res.ok) throw new Error(res.statusText);
  } catch (e) {
    callback(null, { statusCode: 500, body: 'Internal Server Error: ' + e });
  }
};
