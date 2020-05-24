const express = require("express");
const router = express.Router();
const { createEventAdapter } = require('@slack/events-api')
const { WebClient } = require('@slack/web-api');
const moment = require('moment');
const ConversationService = require('../../services/ConversationService');

function createSessionId(channel, user, ts) {
  return `${channel}-${user}-${ts}`;
}

module.exports = (params) => {
  const { reservationService, witService, config, sessionService } = params;
  const slackEvents = createEventAdapter(config.slack.signingSecret);
  const slackWebClient = new WebClient(config.slack.token);
  router.use('/events', slackEvents.requestListener());

  let replyText = '';

  async function processEvent(event, session) {
    const mentionRegex = /<@[A-Z0-9]+>/;
    const requestText = event.text.replace(mentionRegex, '').trim();

    const { conversation } = await ConversationService.run(witService, session.context, requestText);
    const { entities } = conversation;
    if (!conversation.complete) {
      replyText = conversation.followUp;
    } else {
      const { reservationDateTime, numberOfGuests, customerName } = entities;
      //try making a reservation
      const reservationMessage = await reservationService.tryReservation(moment(reservationDateTime).unix(), numberOfGuests, customerName);
      replyText = reservationMessage.success || reservationMessage.error;
    }

    if (conversation.exit || conversation.complete) {
      session.context.conversation = {};
    }

    return slackWebClient.chat.postMessage({
      text: replyText,
      channel: session.context.slack.channel,
      thread_ts: session.context.slack.thread_ts,
      username: 'Resi'
    });
  }

  async function handleMentions(event) {
    const sessionId = createSessionId(event.channel, event.user, event.thread_ts || event.ts);
    let session = sessionService.get(sessionId);
    if (!session) {
      session = sessionService.create(sessionId);
      session.context = {
        slack: {
          channel: event.channel,
          user: event.user,
          thread_ts: event.thread_ts || event.ts
        }
      };
    }
    processEvent(event, session);
  }

  async function handleMessage(event) {
    const mentionRegex = /<@[A-Z0-9]+>/;
    const isAppMentioned = event.text.search(mentionRegex);
    if (isAppMentioned === -1) {
      const sessionId = createSessionId(event.channel, event.user, event.thread_ts || event.ts);
      const session = sessionService.get(sessionId);
      if (!session) return false;
      processEvent(event, session);
    }
    return false;
  }

  slackEvents.on('app_mention', handleMentions);
  slackEvents.on('message', handleMessage);
  return router;
};
