// @ts-check
const fetch = require('node-fetch').default;
const helpers = require('../helpers.js');
const { TOKEN, CHANNEL } = process.env

exports.handler = async function (event, context, callback) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 503, body: 'Unsupported Request Method' };
  }
  
  try {
    const session = JSON.parse(event.body.trim());
    const scheduledMessage = await helpers.getScheduledMessages(session.title);
    helpers.deleteScheduledMessage(scheduledMessage);
    
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: CHANNEL,
        text: `:bomb:  The _*${session.title}*_ session has been deleted.`
      })
    });
    
    callback(null, { statusCode: 204, body: 'Success' });
    if (!res.ok) throw new Error(res.statusText);
  } catch (e) {
    callback(null, { statusCode: 500, body: 'Internal Server Error: ' + e });
  }
};
