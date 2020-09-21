// @ts-check
const fetch = require('node-fetch').default;

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
        Authorization: `Bearer ${process.env.TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: process.env.CHANNEL,
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
              text: `:bulb: ${session.title} \n :watch: ${session.start_time} - ${session.end_time} \n :round_pushpin: ${session.location}`
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
