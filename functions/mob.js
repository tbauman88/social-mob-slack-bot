// @ts-check
const fetch = require('node-fetch').default;

const getMobs = async () => {
  const date = new Date().toISOString().slice(0, 10);
  const mobUrl = 'https://social.vehikl.com/social_mob/week';
  const mobData = await fetch(mobUrl).then((res) => res.json());
  return mobData[date];
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
    let header = ':boom: *Social Mobs* happening today: :boom:';

    if (event.body !== '[object Object]') {
      const slackRes = JSON.parse(
        '{"' +
          decodeURI(event.body)
            .replace(/"/g, '\\"')
            .replace(/&/g, '","')
            .replace(/=/g, '":"') +
          '"}'
      );

      header = `:boom: *${slackRes.user_name}* is wondering what _mobs_ are happening today: :boom:`;
    }

    const res = await fetch(
      `https://hooks.slack.com/services/${process.env.PROD}`,
      {
        method: 'POST',
        body: JSON.stringify({
          blocks: [
            {
              type: 'section',
              text: { type: 'mrkdwn', text: header }
            },
            { type: 'divider' },
            ...mobs.map((mob) => {
              return {
                type: 'section',
                block_id: `${mob.id}`,
                text: {
                  type: 'mrkdwn',
                  text: `:bulb: ${mob.topic} \n :watch: ${mob.start_time} - ${mob.end_time} \n :busts_in_silhouette:  (${mob.attendees.length}) Attendees \n :round_pushpin: ${mob.location}`
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
      }
    );

    callback(null, { statusCode: 204, body: 'Success' });
  } catch (e) {
    callback(null, { statusCode: 500, body: 'Internal Server Error: ' + e });
  }
};
