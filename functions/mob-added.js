// @ts-check
const fetch = require('node-fetch').default;
const { CHANNEL, TOKEN } = process.env;

exports.handler = async function (event, context, callback) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 503,
      body: 'Unsupported Request Method'
    };
  }
  const session = JSON.parse(event.body.trim());
  callback(null, { statusCode: 204, body: 'Success' });

  try {
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
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: ':boom: A `NEW` session has been added for today :boom:'
            }
          },
          { type: 'divider' },
          {
            type: 'section',
            block_id: `${session.id}`,
            text: {
              type: 'mrkdwn',
              text: `:bulb: <https://growth.vehikl.com/growth_sessions/${session.id}| ${session.title}> \n :watch: ${session.start_time} - ${session.end_time} \n :busts_in_silhouette: ${session.attendee_limit || 'nth of'} attendees available \n :round_pushpin: ${session.location}`
            },
            accessory: {
              type: 'image',
              image_url: session.owner.avatar,
              alt_text: session.owner.name
            }
          }
        ]
      })
    });

    if (!res.ok) throw new Error(res.statusText);
  } catch (e) {
    callback(null, { statusCode: 500, body: 'Internal Server Error: ' + e });
  }
};
