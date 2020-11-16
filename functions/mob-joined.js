// @ts-check
const fetch = require('node-fetch').default;
import { convertTime12to24, deleteScheduledMessage, getScheduledMessages } from '../helpers'

exports.handler = async function (event, context, callback) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 503, body: 'Unsupported Request Method' };
  }

  try {
    const session = JSON.parse(event.body.trim());
    const scheduledMessage = await getScheduledMessages(session.title);
    deleteScheduledMessage(scheduledMessage);

    fetch(
      `https://${process.env.NAME}.netlify.app/.netlify/functions/session-scheduler`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: session.id,
          title: session.title,
          time: convertTime12to24(session.date, session.start_time),
          attendees: [session.owner.name, ...session.attendees.map(({ name }) => name)]
        })
      }
    );

    callback(null, { statusCode: 204, body: 'Success' });
  } catch (e) {
    callback(null, { statusCode: 500, body: 'Internal Server Error: ' + e });
  }
};
