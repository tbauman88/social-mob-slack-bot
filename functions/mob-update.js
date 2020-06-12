// @ts-check
const fetch = require('node-fetch').default;

exports.handler = async function (event, context, callback) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 503,
      body: 'Unsupported Request Method'
    };
  }
  const { id, topic } = JSON.parse(event.body.trim());
  const title = topic.replace(/\n|\r/g, '');

  callback(null, { statusCode: 204, body: 'Success' });

  try {
    let header = ':boom: *Social Mobs* happening today: :boom:';

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
              text: `:zap: The _*${title}*_ mob has been updated recently. <https://social.vehikl.com/social_mob/${id}| View Mob>`
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
