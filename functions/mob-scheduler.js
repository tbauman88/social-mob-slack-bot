// @ts-check
const fetch = require('node-fetch').default;

const getMobAttendees = async (attendees) => {
  const url = `https://slack.com/api/users.list?token=${process.env.TOKEN}`;
  const { members } = await fetch(url).then((res) => res.json());
  const users = members
    .filter((m) => !m.deleted && !m.is_bot && !m.is_restricted)
    .map(({ real_name, id }) => ({ id, name: real_name }));

  let slackUsers = [];

  attendees.forEach((attendee) => {
    const person = users.find((p) => p.name === attendee);
    person && slackUsers.push(`<@${person.id}>`);
  });

  return slackUsers.join(' ');
};

const getMob = async (id) => {
  const mobUrl = 'https://social.vehikl.com/social_mobs/day';
  const mobs = await fetch(mobUrl).then((res) => res.json());
  const { attendees, owner } = mobs.find((mob) => mob.id === id);
  return [owner.name, ...attendees.map(({ name }) => name)];
};

exports.handler = async function (event, context, callback) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 503,
      body: 'Unsupported Request Method'
    };
  }

  try {
    const { id, time, topic } = JSON.parse(event.body);
    const members = await getMob(id);
    const attendees = await getMobAttendees(members);
    const title = topic.replace(/\n|\r/g, '');

    const res = await fetch('https://slack.com/api/chat.scheduleMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: process.env.CHANNEL,
        text: `This is a reminder the *_${title}_* mob will start in 10 minutes ${attendees}`,
        post_at: new Date(time).getTime() / 1000.0
      })
    });

    callback(null, { statusCode: 204, body: 'Success' });
  } catch (e) {
    callback(null, { statusCode: 500, body: 'Internal Server Error: ' + e });
  }
};
