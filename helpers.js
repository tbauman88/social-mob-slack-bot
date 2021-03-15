const fetch = require('node-fetch').default;
const slackAPI = 'https://slack.com/api'
const { TOKEN, MOBS_TOKEN, CHANNEL } = process.env

module.exports = {
  convertTime12to24: (day, time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
  
    if (hours === '12') {
      hours = '00';
    }
  
    if (modifier === 'pm') {
      hours = parseInt(hours) + 16;
    }
  
    if (minutes === '00') {
      minutes = parseInt(minutes) + 50;
    } else {
      hours = hours + 1
      minutes = parseInt(minutes) - 10;
    }
  
    return new Date(`${day}T${hours}:${minutes}`);
  },
  
  deleteScheduledMessage: (message) => {
    const url = `${slackAPI}/api/chat.deleteScheduledMessage`;
  
    fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: CHANNEL,
        scheduled_message_id: message.id
      })
    }).then((res) => res.json());
  },
  
  getScheduledMessages: async (title) => {
    const url = `${slackAPI}/chat.scheduledMessages.list?token=${TOKEN}`;
    const { scheduled_messages } = await fetch(url).then((res) => res.json());
    return scheduled_messages.find(({ text }) => text.includes(title));
  },
  
  getMobs: async (mobId) => {
    const date = new Date().toISOString().slice(0, 10);
    const mobUrl = 'https://growth.vehikl.com/growth_sessions/day';
    const mobs = await fetch(mobUrl).then((res) => res.json());
    return mobs.find((m) => m.id === mobId);
  },
  
  getMobAttendees: async (attendees) => {
    const url = `https://slack.com/api/users.list?token=${TOKEN}`;
    const { members } = await fetch(url).then((res) => res.json());
    const users = members
      .filter((m) => !m.deleted && !m.is_bot && !m.is_restricted)
      .map(({ real_name, id }) => ({ id, name: real_name }));
  
    let slackUsers = [];
  
    attendees.forEach((attendee) => {
      const person = users.find(({name}) => 
        name.toLowerCase() === attendee.toLowerCase());
      person && slackUsers.push(`<@${person.id}>`);
    });
  
    return slackUsers.join(' ');
  },
  
  getSessions: async () => {
    const url = 'https://growth.vehikl.com/growth_sessions/day';
    const sessions = await fetch(url, {
      headers: { Authorization: `Bearer ${MOBS_TOKEN}` }
    }).then((res) => res.json());
    return sessions;
  }
}

