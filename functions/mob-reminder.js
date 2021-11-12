// @ts-check
const fetch = require('node-fetch').default;
const helpers = require('../helpers.js');
const { TOKEN, CHANNEL } = process.env

exports.handler = async function (event, context, callback) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 503, body: 'Unsupported Request Method' };
  }

  callback(null, { statusCode: 204, body: 'Success' });

  try {
    const mobId = event.queryStringParameters.mob;
    const mob = await helpers.getMobs(+mobId);
    const members = mob.attendees.map(({ name }) => name);
    const attendees = await helpers.getMobAttendees(members);

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: CHANNEL,
        text: `This is a reminder the *_${mob.title}_* growth session is starting now! ${attendees} ${mob.location}`
      })
    });

    if (!res.ok) throw new Error(res.statusText);
  } catch (e) {
    callback(null, { statusCode: 500, body: 'Internal Server Error: ' + e });
  }
};
