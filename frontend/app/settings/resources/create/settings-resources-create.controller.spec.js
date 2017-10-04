'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The CalSettingsResourcesCreateController controller', function() {
  var $q, $state, $controller, $rootScope, $scope, context, resource, esnResourceAPIClient, asyncAction, CAL_RESOURCE;

  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calendar');
  });

  beforeEach(function() {
    resource = {name: 'Foo', description: 'bar'};
    asyncAction = sinon.spy();
    esnResourceAPIClient = {};
    context = {
      resource: resource
    };

    module(function($provide) {
      $provide.value('asyncAction', asyncAction);
      $provide.value('esnResourceAPIClient', esnResourceAPIClient);
    });
  });

  beforeEach(angular.mock.inject(function(_$state_, _$controller_, _$rootScope_, _$q_, _CAL_RESOURCE_, _esnResourceAPIClient_) {
    $state = _$state_;
    $controller = _$controller_;
    $rootScope = _$rootScope_;
    $q = _$q_;
    CAL_RESOURCE = _CAL_RESOURCE_;
    esnResourceAPIClient = _esnResourceAPIClient_;
    $scope = $rootScope.$new();
  }));

  function initController() {
    return $controller('CalSettingsResourcesCreateController', {$scope: $scope}, context);
  }

  describe('The submit function', function() {
    var ctrl;

    beforeEach(function() {
      ctrl = initController();
    });

    it('should call the resourceAPIClient.create correctly and reload the resources', function() {
      esnResourceAPIClient.create = sinon.stub().returns($q.when());
      var goSpy = sinon.spy($state, 'go');

      ctrl.submit();
      asyncAction.firstCall.args[1]();
      $rootScope.$digest();

      expect(esnResourceAPIClient.create).to.have.been.calledWith({
        type: CAL_RESOURCE.type,
        name: resource.name,
        description: resource.description
      });

      expect(goSpy).to.have.been.calledWith('calendar.settings.resources', sinon.match.any, { reload: true });
    });
  });
});
