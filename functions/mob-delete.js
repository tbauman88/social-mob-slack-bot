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
  const topic = mob.topic.replace(/\n|\r/g, '');

  callback(null, { statusCode: 204, body: 'Success' });

  // TODO: #9 Check scheduledMessages.list for deleted mob and remove scheduledMessage @tbauman88

  try {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: process.env.CHANNEL,
        text: `:bomb:  The _*${topic}*_ mob has been deleted.`
      })
    });

    if (!res.ok) throw new Error(res.statusText);
  } catch (e) {
    callback(null, { statusCode: 500, body: 'Internal Server Error: ' + e });
  }
};
