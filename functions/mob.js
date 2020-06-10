// @ts-check
const fetch = require('node-fetch').default;
const CronJob = require('cron').CronJob;

const getMobs = async () => {
  const date = new Date().toISOString().slice(0, 10);
  const mobUrl = 'https://social.vehikl.com/social_mob/week';
  const mobData = await fetch(mobUrl).then((res) => res.json());
  return mobData[date];
};

const setMobReminder = (mobId, reminder) => {
  const job = new CronJob(
    reminder,
    async () => {
      await fetch(
        `https://${process.env.NAME}.netlify.app/.netlify/functions/mob-reminder?mob=${mobId}`,
        {
          method: 'POST'
        }
      );
    },
    null,
    true,
    'America/New_York'
  );
  job.start();
};

const convertTime12to24 = (mobId, day, time12h) => {
  const [time, modifier] = time12h.split(' ');

  let [hours, minutes] = time.split(':');

  if (hours === '12') {
    hours = '00';
  }

  if (modifier === 'pm') {
    hours = parseInt(hours, 10) + 12;
  }

  if (minutes === '00') {
    hours = parseInt(hours) - 1;
    minutes = parseInt(minutes) + 50;
  } else {
    minutes = parseInt(minutes) - 10;
  }

  const reminder = new Date(`${day}T${hours}:${minutes}`);
  return setMobReminder(mobId, reminder);
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
    let header = ':boom: *Social Mobs* happening today: :boom:';

    if (mobs.length > 0) {
      mobs.map(({ id, date, start_time }) =>
        convertTime12to24(id, date, start_time)
      );
    }

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: process.env.CHANNEL,
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
    });

    if (!res.ok) throw new Error(res.statusText);
  } catch (e) {
    callback(null, { statusCode: 500, body: 'Internal Server Error: ' + e });
  }
};
