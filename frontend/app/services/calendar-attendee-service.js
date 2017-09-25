(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('calendarAttendeeService', calendarAttendeeService);

  function calendarAttendeeService(attendeeService, CAL_ICAL, CAL_ATTENDEE_OBJECT_TYPE) {
    var service = {
      getAttendeeCandidates: getAttendeeCandidates
    };
    var attendeeTypeToPartstat = {};

    attendeeTypeToPartstat[CAL_ATTENDEE_OBJECT_TYPE.user] = CAL_ICAL.partstat.needsaction;
    attendeeTypeToPartstat[CAL_ATTENDEE_OBJECT_TYPE.resource] = CAL_ICAL.partstat.accepted;

    return service;

    function getAttendeeCandidates(query, limit) {
      return attendeeService.getAttendeeCandidates(query, limit, [CAL_ATTENDEE_OBJECT_TYPE.user, CAL_ATTENDEE_OBJECT_TYPE.resource]).then(function(attendeeCandidates) {
        return attendeeCandidates.map(function(attendeeCandidate) {
          attendeeCandidate.partstat = attendeeTypeToPartstat[attendeeCandidate.objectType] || CAL_ICAL.partstat.needsaction;

          return attendeeCandidate;
        });
      });
    }
  }

})();
