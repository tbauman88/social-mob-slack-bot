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
    const mobUrl = 'https://growth.vehikl.com/growth_sessions/day';
    const mobs = await fetch(mobUrl).then((res) => res.json());
    return mobs.find((m) => m.id === mobId);
  },
  
  getMobAttendees: async (attendees) => {
    const response = await fetch(`https://slack.com/api/users.list?token=${TOKEN}`);
    const data = await response.json();

    let slackUsers = [];
    const users = data.members
      .filter(member => !member.deleted && !member.is_bot && !member.is_restricted)
      .map(({ real_name, id }) => ({ id, name: real_name }));
  
    for (const attendee of attendees) {
      const person = users.find(({ name }) => name.toLowerCase() == attendee.toLowerCase());
      if (person === undefined) continue
      slackUsers.push(`<@${person.id}>`);
    }
  
    return slackUsers.join(' ');
  },
  
  getAfternoonSessions: async () => {
    const url = 'https://growth.vehikl.com/growth_sessions/day';
    const sessions = await fetch(url, {
      headers: { Authorization: `Bearer ${MOBS_TOKEN}` }
    }).then((res) => res.json());
    return sessions.filter(s => s.start_time.includes('pm'));
  },

  getMorningSessions: async () => {
    const url = 'https://growth.vehikl.com/growth_sessions/day';
    const sessions = await fetch(url, {
      headers: { Authorization: `Bearer ${MOBS_TOKEN}` }
    }).then((res) => res.json());
    
    return sessions.filter(s => s.start_time.includes('am'));
  }
}

