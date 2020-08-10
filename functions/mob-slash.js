// @ts-check
const fetch = require('node-fetch').default;
const { MOBS_TOKEN, TOKEN } = process.env;

const getMobs = async () => {
  const mobUrl = 'https://social.vehikl.com/social_mobs/day';
  const mobs = await fetch(mobUrl, {
    headers: { Authorization: `Bearer ${MOBS_TOKEN}` }
  }).then((res) => res.json());
  return mobs;
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
    const mobs = await getMobs();
    const parsed = new URLSearchParams(event.body);
    const user = parsed.get('user_name');
    const channel = parsed.get('channel_id');

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `:boom: *${user}* is wondering what _mobs_ are happening today: :boom:`
            }
          },
          { type: 'divider' },
          ...mobs.map((mob) => {
            return {
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
            };
          })
        ]
      })
    });

    if (!res.ok) throw new Error(res.statusText);
  } catch (e) {
    callback(null, { statusCode: 500, body: 'Internal Server Error: ' + e });
  }
};
