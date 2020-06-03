// @ts-check
const fetch = require('node-fetch').default;

const getMobs = async () => {
  const date = new Date().toLocaleDateString('en-CA');
  const mobUrl = 'https://social.vehikl.com/social_mob/week';
  const mobData = await fetch(mobUrl).then((res) => res.json());
  return mobData[date].map(
    ({ id, topic, location, owner, start_time, end_time, attendees }) => ({
      id,
      topic,
      location,
      owner,
      start_time,
      end_time,
      attendees
    })
  );
};

exports.handler = async function (event, context, callback) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 503,
      body: 'Unsupported Request Method'
    };
  }

  try {
    const mobs = await getMobs();

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Social mobs for today:'
        }
      },
      { type: 'divider' },
      ...mobs.map((mob) => {
        return {
          type: 'section',
          block_id: 1,
          text: {
            type: 'mrkdwn',
            text: `*Organizer:* ${mob.owner?.name} (${mob.attendees.length}) \n ${mob.topic} \n ${mob.start_time} - ${mob.end_time} \n ${mob.location}`
          },
          accessory: {
            type: 'image',
            image_url: mob.owner.avatar,
            alt_text: mob.owner.name
          }
        };
      })
    ];

    await fetch(`https://hooks.slack.com/services/${process.env.TESTING}`, {
      method: 'POST',
      body: JSON.stringify({ blocks })
    });

    callback(null, { statusCode: 200, body: `${JSON.stringify({ blocks })}` });
  } catch (e) {
    callback(null, { statusCode: 500, body: 'Internal Server Error: ' + e });
  }
};
