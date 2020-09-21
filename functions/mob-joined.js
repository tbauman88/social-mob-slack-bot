// @ts-check
const fetch = require('node-fetch').default;

const getScheduledMessages = async (title) => {
  const url = `	https://slack.com/api/chat.scheduledMessages.list?token=${process.env.TOKEN}`;
  const { scheduled_messages } = await fetch(url).then((res) => res.json());
  return scheduled_messages.find(({ text }) => text.includes(title));
};

const deleteScheduledMessage = (message) => {
  const url = 'https://slack.com/api/chat.deleteScheduledMessage';

  fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      channel: process.env.CHANNEL,
      scheduled_message_id: message.id
    })
  }).then((res) => res.json());
};

const convertTime12to24 = (day, time12h) => {
  const [time, modifier] = time12h.split(' ');

  let [hours, minutes] = time.split(':');

  if (hours === '12') {
    hours = '00';
  }

  if (modifier === 'pm') {
    hours = parseInt(hours) + 16;
  }

  if (minutes === '00') {
    hours = parseInt(hours) - 1;
    minutes = parseInt(minutes) + 50;
  } else {
    minutes = parseInt(minutes) - 10;
  }

  const reminder = new Date(`${day}T${hours}:${minutes}`);
  return reminder;
};

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
