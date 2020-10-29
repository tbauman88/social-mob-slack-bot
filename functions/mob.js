// @ts-check
const fetch = require('node-fetch').default;
const { CHANNEL, MOBS_TOKEN, NAME, TOKEN } = process.env;

const getSessions = async () => {
  const url = 'https://growth.vehikl.com/social_mobs/day';
  const sessions = await fetch(url, {
    headers: { Authorization: `Bearer ${MOBS_TOKEN}` }
  }).then((res) => res.json());
  return sessions;
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
    const sessions = await getSessions();
    const headers = {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    };

    if (sessions.length === 0) {
      return fetch(`https://slack.com/api/chat.postMessage`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          channel: CHANNEL,
          text: `Nothing is scheduled for today. <https://growth.vehikl.com/| _*Be Better*_ >`
        })
      });
    }

    if (sessions.length > 0) {
      sessions.forEach(({ attendees, date, id, owner, start_time, title }) => {
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
              text: `*_Colin_*: Lets talk growth, what do we have today Margo? \n *_Margo_*: Great question Colin!`
            }
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: ':boom: Growth sessions happening today: :boom:' }
          },
          { type: 'divider' },
          ...sessions.map(({
            id, title, start_time, end_time, attendees, attendee_limit, location, owner
          }) => ({
            type: 'section',
            block_id: `${id}`,
            text: {
              type: 'mrkdwn',
              text: `:bulb: <https://growth.vehikl.com/social_mobs/${id}| ${title}>  \n :watch: ${start_time} - ${end_time} \n :busts_in_silhouette:  ${attendees.length} / ${attendee_limit || 'nth number'} Attendees \n :round_pushpin: ${location}`
            },
            accessory: {
              type: 'image',
              image_url: owner.avatar,
              alt_text: owner.name
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
