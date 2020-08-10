// @ts-check
const fetch = require('node-fetch').default;
const { CHANNEL, MOBS_TOKEN, NAME, TOKEN } = process.env;

const getMobs = async () => {
  const mobUrl = 'https://social.vehikl.com/social_mobs/day';
  const mobs = await fetch(mobUrl, {
    headers: { Authorization: `Bearer ${MOBS_TOKEN}` }
  }).then((res) => res.json());
  return mobs;
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

  callback(null, { statusCode: 204, body: 'Success' });

  try {
    const mobs = await getMobs();
    const headers = {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    };

    if (mobs.length === 0) {
      return fetch(`https://slack.com/api/chat.postMessage`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          channel: CHANNEL,
          text: `No mobs are scheduled for today. _*Be Better*_ and <https://social.vehikl.com/| schedule a mob>`
        })
      });
    }

    if (mobs.length > 0) {
      mobs.forEach(({ attendees, date, id, owner, start_time, title }) => {
        fetch(`https://${NAME}.netlify.app/.netlify/functions/mob-scheduler`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            title,
            time: convertTime12to24(date, start_time),
            attendees: [owner.name, ...attendees.map(({ name }) => name)]
          })
        });
      });
    }

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        channel: CHANNEL,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*_Colin_*: What social mobs do we have today Margo? \n *_Margo_*: Great question Colin!`
            }
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: ':boom: *Social Mobs* happening today: :boom:' }
          },
          { type: 'divider' },
          ...mobs.map((mob) => ({
            type: 'section',
            block_id: `${mob.id}`,
            text: {
              type: 'mrkdwn',
              text: `:bulb: ${mob.title} \n :watch: ${mob.start_time} - ${mob.end_time} \n :busts_in_silhouette:  (${mob.attendees.length}) Attendees \n :round_pushpin: ${mob.location}`
            },
            accessory: {
              type: 'image',
              image_url: mob.owner.avatar,
              alt_text: mob.owner.name
            }
          }))
        ]
      })
    });

    if (!res.ok) throw new Error(res.statusText);
  } catch (e) {
    callback(null, { statusCode: 500, body: 'Internal Server Error: ' + e });
  }
};
