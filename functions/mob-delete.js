// @ts-check
const fetch = require('node-fetch').default;
const { TOKEN, CHANNEL } = process.env
import { deleteScheduledMessage, getScheduledMessages } from '../helpers'

exports.handler = async function (event, context, callback) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 503,
      body: 'Unsupported Request Method'
    };
  }
  
  try {
    const session = JSON.parse(event.body.trim());
    const scheduledMessage = await getScheduledMessages(session.title);
    deleteScheduledMessage(scheduledMessage);
    
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
