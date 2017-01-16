'use strict';

angular.module('esn.calendar')

  .controller('calInboxInvitationMessageBlueBarController', function($q, $log, calEventService, calendarHomeService,
                                                                     calEventUtils, notificationFactory, INVITATION_MESSAGE_HEADERS) {
    var self = this,
        defaultParticipationButtonClass = 'btn-default';

    self.$onInit = function() {
      self.meeting = {
        method: self.message.headers[INVITATION_MESSAGE_HEADERS.METHOD] || 'REQUEST',
        uid: self.message.headers[INVITATION_MESSAGE_HEADERS.UID],
        recurrenceId: self.message.headers[INVITATION_MESSAGE_HEADERS.RECURRENCE_ID],
        sequence: self.message.headers[INVITATION_MESSAGE_HEADERS.SEQUENCE] || '0'
      };

      calendarHomeService.getUserCalendarHomeId()
        .then(getEventByUID)
        .then(selectMasterEventOrException, handleNonExistentEvent)
        .then(assertEventInvolvesCurrentUser)
        .then(assertInvitationSequenceIsNotOutdated)
        .then(bindEventToController)
        .catch(handleErrorOrInvalidMeeting)
        .finally(function() {
          self.meeting.loaded = true;
        });
    };

    self.changeParticipation = function(partstat) {
      var attendee = userAttendee(self.event);

      if (attendee.partstat === partstat) {
        return;
      }

      calEventService.changeParticipation(self.event.path, self.event, [attendee.email], partstat, self.event.etag)
        .then(selectMasterEventOrException)
        .then(bindEventToController)
        .then(notify('Participation updated!'), notify('Cannot change your participation to this event'));
    };

    self.getParticipationButtonClass = function(cls, partstat) {
      return userAttendee(self.event).partstat === partstat ? cls : defaultParticipationButtonClass;
    };

    /////

    function handleErrorOrInvalidMeeting(err) {
      if (err instanceof InvalidMeetingError) {
        self.meeting.invalid = true;
      } else {
        self.meeting.error = err.message || err;
      }

      $log.error(err);
    }

    function handleNonExistentEvent(err) {
      return $q.reject(err.status === 404 ? new InvalidMeetingError('Event not found.') : err);
    }

    function userAttendee(event) {
      return calEventUtils.getUserAttendee(event);
    }

    function getEventByUID(userCalendarHomeId) {
      return calEventService.getEventByUID(userCalendarHomeId, self.meeting.uid);
    }

    function selectMasterEventOrException(event) {
      if (self.meeting.recurrenceId) {
        event = event.getExceptionByRecurrenceId(self.meeting.recurrenceId);

        if (!event) {
          return $q.reject(new InvalidMeetingError('Occurrence ' + self.meeting.recurrenceId + ' not found.'));
        }
      }

      return event;
    }

    function assertEventInvolvesCurrentUser(event) {
      if (!userAttendee(event)) {
        return $q.reject(new InvalidMeetingError('Event does not involve current user.'));
      }

      return event;
    }

    function assertInvitationSequenceIsNotOutdated(event) {
      if (+self.meeting.sequence < +event.sequence) {
        return $q.reject(new InvalidMeetingError('Sequence is outdated (event.sequence = ' + event.sequence + ').'));
      }

      return event;
    }

    function bindEventToController(event) {
      self.event = event;
    }

    function notify(text) {
      return function() {
        notificationFactory.weakInfo('', text);
      };
    }

    /////

    function InvalidMeetingError(message) {
      this.message = message;
      this.meeting = self.meeting;
    }

  });
