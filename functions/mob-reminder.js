// @ts-check
const fetch = require('node-fetch').default;

const getMobs = async (mobId) => {
  const date = new Date().toISOString().slice(0, 10);
  const mobUrl = 'https://social.vehikl.com/social_mobs/day';
  const mobs = await fetch(mobUrl).then((res) => res.json());
  return mobs.find((m) => m.id === mobId);
};

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

exports.handler = async function (event, context, callback) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 503,
      body: 'Unsupported Request Method'
    };
  }

  callback(null, { statusCode: 204, body: 'Success' });

  try {
    const mobId = event.queryStringParameters.mob;
    const mob = await getMobs(+mobId);
    const members = [mob.owner.name, ...mob.attendees.map(({ name }) => name)];
    const attendees = await getMobAttendees(members);

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: process.env.CHANNEL,
        text: `This is a reminder the *_${mob.title}_* mob will start in 10 minutes ${attendees}`
      })
    });

    if (!res.ok) throw new Error(res.statusText);
  } catch (e) {
    callback(null, { statusCode: 500, body: 'Internal Server Error: ' + e });
  }
};
