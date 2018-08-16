const ConnectionManager = require('./db/connection_manager');
const connectionDefinitions = require('./connection_definitions');
const logger = require('./app_logger');
module.exports = new ConnectionManager(connectionDefinitions, logger);
