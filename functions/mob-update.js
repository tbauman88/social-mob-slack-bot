// @ts-check
const fetch = require('node-fetch').default;

exports.handler = async function (event, context, callback) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 503,
      body: 'Unsupported Request Method'
    };
  }
  const mob = JSON.parse(event.body.trim());

  callback(null, { statusCode: 204, body: 'Success' });

  // TODO: #8 Check scheduledMessages.list for updated mob and remove scheduledMessage and rerun mob-scheduler @tbauman88

  try {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: process.env.CHANNEL,
        text: `:zap: The _*${mob.title}*_ mob has been updated recently. <https://social.vehikl.com/social_mobs/${mob.id}| View Mob>`
      })
    });

    if (!res.ok) throw new Error(res.statusText);
  } catch (e) {
    callback(null, { statusCode: 500, body: 'Internal Server Error: ' + e });
  }
};
