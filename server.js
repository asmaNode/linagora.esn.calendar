'use strict';

var async = require('async');
var moduleManager = require('./backend/module-manager');
var core = require('./backend/core');
var config = core.config('default');
var logger = core.logger;

moduleManager.manager.registerState('deploy', ['lib']);
moduleManager.manager.registerState('start', ['lib', 'deploy']);

moduleManager.setupManager(config);
moduleManager.manager.registerModule(require('./backend/webserver/webserver-wrapper'));
moduleManager.manager.registerModule(require('./backend/webserver/webserver').awesomeWebServer);
moduleManager.manager.registerModule(require('./backend/wsserver').awesomeWsServer);
moduleManager.manager.registerModule(require('./backend/webrtc').awesomeWebRTCServer);

core.init();

logger.info('OpenPaaS Core bootstraped, configured in %s mode', process.env.NODE_ENV);

function startESN(callback) {
  moduleManager.manager.fire('start', 'linagora.esn.core.esn');
  callback();
}

async.series([core.templates.inject, startESN], function(err) {
  if ( err ) {
    logger.error('Fatal error:', err);
    if ( err.stack ) {
      logger.error(err.stack);
    }
    process.exit(1);
  }
  logger.info('OpenPaas ESN is now started on node %s', process.version);
});
