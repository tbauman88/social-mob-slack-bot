## Social Mob Slack Bot 🤖

Custom Slack application to post daily social mobs.

Using [Netlify Functions](https://docs.netlify.com/functions/overview/) it will grab todays social mobs and post them to Slack using webhook and their [Block Kit](https://api.slack.com/block-kit) component structure.

```ts
{
  type: 'section',
  block_id: mob.id,
  text: {
    type: 'mrkdwn',
    text: `*Organizer:* ${mob.owner?.name} (${mob.attendees.length}) \n ${mob.topic} \n ${mob.start_time} - ${mob.end_time} \n ${mob.location}`
  },
  accessory: {
    type: 'image',
    image_url: mob.owner?.avatar,
    alt_text: mob.owner?.name
  }
}
```

## Preview 