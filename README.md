## Social Mob Slack Bot 🤖

Custom Slack application to post daily social mobs.

Using [Netlify Functions](https://docs.netlify.com/functions/overview/) it will grab todays social mobs and post them to Slack using webhook and their [Block Kit](https://api.slack.com/block-kit) component structure.

```ts
{
  type: 'section',
  block_id: `${mob.id}`,
  text: {
    type: 'mrkdwn',
    text: `:bulb: ${mob.topic} \n :watch: ${mob.start_time} - ${mob.end_time} \n :round_pushpin: ${mob.location} \n :busts_in_silhouette:  (${mob.attendees.length}) Attendees`
  },
  accessory: {
    type: 'image',
    image_url: mob.owner.avatar,
    alt_text: mob.owner.name
  }
}
```

## Preview

<div align="center">
  <img src="./assets/preview.png">
</div>