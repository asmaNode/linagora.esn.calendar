(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('calendarAttendeeService', calendarAttendeeService);

  function calendarAttendeeService(attendeeService, CAL_ICAL, CAL_ATTENDEE_OBJECT_TYPE) {
    var service = {
      getAttendeeCandidates: getAttendeeCandidates
    };
    var attendeeTypeToPartstat = {};
    var attendeeTypeToCUType = {};

    attendeeTypeToPartstat[CAL_ATTENDEE_OBJECT_TYPE.user] = CAL_ICAL.partstat.needsaction;
    attendeeTypeToPartstat[CAL_ATTENDEE_OBJECT_TYPE.resource] = CAL_ICAL.partstat.tentative;
    attendeeTypeToCUType[CAL_ATTENDEE_OBJECT_TYPE.user] = CAL_ICAL.cutype.individual;
    attendeeTypeToCUType[CAL_ATTENDEE_OBJECT_TYPE.resource] = CAL_ICAL.cutype.resource;

    return service;

    function getAttendeeCandidates(query, limit, types) {
      var typesFilter = types instanceof Array ? types : [CAL_ATTENDEE_OBJECT_TYPE.user];

      return attendeeService.getAttendeeCandidates(query, limit, typesFilter)
        .then(function(attendeeCandidates) {
          return attendeeCandidates.map(mapPartStat).map(mapCUType);
        });
    }

    function mapPartStat(attendee) {
      attendee.partstat = attendeeTypeToPartstat[attendee.objectType] || CAL_ICAL.partstat.needsaction;

      return attendee;
    }

    function mapCUType(attendee) {
      attendee.cutype = attendeeTypeToCUType[attendee.objectType] || CAL_ICAL.cutype.individual;

      return attendee;
    }
  }

})();
