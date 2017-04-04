'use strict';

const NAMESPACE = '/calendars';
const PUBSUB_EVENT = 'calendar:event:updated';
const CONSTANTS = require('../lib/constants');
const EVENTS = CONSTANTS.EVENTS;
const NOTIFICATIONS = CONSTANTS.NOTIFICATIONS;
const ICAL = require('ical.js');
const _ = require('lodash');
let initialized = false;

module.exports = {
  init
};

function init(dependencies) {
  const logger = dependencies('logger');
  const pubsub = dependencies('pubsub');
  const io = dependencies('wsserver').io;
  const ioHelper = dependencies('wsserver').ioHelper;

  if (initialized) {
    logger.warn('The calendar notification service is already initialized');

    return;
  }

  pubsub.global.topic(PUBSUB_EVENT).subscribe(msg => {
    pubsub.local.topic(PUBSUB_EVENT).publish(msg);
    notify(io, ioHelper, msg.websocketEvent, msg);
    emitElasticSearchEvent(pubsub, msg);
  });

  io.of(NAMESPACE)
    .on('connection', socket => {
      logger.info('New connection on ' + NAMESPACE);

      socket.on('subscribe', uuid => {
        logger.info('Joining room', uuid);
        socket.join(uuid);
      });

      socket.on('unsubscribe', uuid => {
        logger.info('Leaving room', uuid);
        socket.leave(uuid);
      });
    });
  initialized = true;
}

function parseEventPath(eventPath) {
  // The eventPath is in this form : /calendars/{{userId}}/calendarId/{{eventUid}}
  const pathParts = eventPath.replace(/^\//, '').split('/');

  return {
    userId: pathParts[1],
    calendarId: pathParts[2],
    eventUid: pathParts[3].replace(/\.ics$/, '')
  };
}

function parseUserPrincipal(userPrincipal) {
  // The userPrincipal is in this form : principals/users/{{userId}}
  const pathParts = userPrincipal.split('/');

  return pathParts[2];
}

function notify(io, ioHelper, event, msg) {
  const userIds = [parseEventPath(msg.eventPath).userId];

  if (msg.shareeIds) {
    msg.shareeIds.forEach(shareePrincipals => userIds.push(parseUserPrincipal(shareePrincipals)));
  }

  delete msg.shareeIds;

  userIds.forEach(userId => {
    const clientSockets = ioHelper.getUserSocketsFromNamespace(userId, io.of(NAMESPACE).sockets) || [];

    _.invokeMap(clientSockets, 'emit', event, msg);
  });
}

function emitElasticSearchEvent(pubsub, msg) {
  const data = parseEventPath(msg.eventPath);
  const action = msg.websocketEvent;

  data.ics = (new ICAL.Component(msg.event)).toString();

  if (action === EVENTS.EVENT.CREATED || action === EVENTS.EVENT.REQUEST) {
    pubsub.local.topic(NOTIFICATIONS.ADDED).publish(data);
  } else if (action === EVENTS.EVENT.UPDATED || action === EVENTS.EVENT.REPLY) {
    pubsub.local.topic(NOTIFICATIONS.UPDATED).publish(data);
  } else if (action === EVENTS.EVENT.DELETED || action === EVENTS.EVENT.CANCEL) {
    pubsub.local.topic(NOTIFICATIONS.DELETED).publish(data);
  } else {
    throw new Error('Unknow Event received for Calendar Indexing', action);
  }
}
