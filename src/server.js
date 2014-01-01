var Player = require('./player.js')
  , Game = require('./game.js')
  , express = require('express')
  , Wasabi = require('wasabi')
  , WebSocket = require('ws')
  , browserify = require('browserify')
  ;

var PROCESS_CONNECTIONS_INTERVAL = 1000/15;
var RUN_INTERVAL = 1000/60;

/**
 * Encapsulated server functionality
 * @class Server
 */
function Server() {
    this._app = null;
    this._serverSocket = null;
    this._game = new Game;
    this._lastRun = null;
    this._lastProcessConnections = Date.now();
    this._players = {};
}

/**
 * Initialize server and begin hosting
 * @method init
 */
Server.prototype.init = function() {
    this._app = express();
    this._app.use(express.static('public'));
    this._app.use(express.static('src'));
    this._app.use(this.clientScriptHandler);
    this._app.listen(8080);

    var server = this;
    this._serverSocket = new WebSocket.Server({port:1234}, function() { server.hostCallback(); });
    this._serverSocket.on('connection', function(clientSock) { server.connectionCallback(clientSock); });

    Wasabi.on('sendError', function(conn, err) {
        var player = conn.player;
        Wasabi.removeObject(player);
        conn.player = undefined;
    }.bind(this));
}

/**
 * Begin the run loop
 * @method hostCallback
 */
Server.prototype.hostCallback = function() {
    this.run();
};

/**
 * Update the game, process connections, and schedule the next frame
 * @method run
 */
Server.prototype.run = function() {
    var now = Date.now();

    // handle connections
    if(now - this._lastProcessConnections >= PROCESS_CONNECTIONS_INTERVAL) {
        Wasabi.processConnections();
        this._lastProcessConnections = now;
    }

    // update the simulation
    if(now - this._lastRun >= RUN_INTERVAL) {
        var deltaSeconds = (now - this._lastRun) / 1000;
        this._game.run(deltaSeconds);
        this._lastRun = now;
    }

    setTimeout(this.run.bind(this), 1000/60);
};

/**
 * Handle an incoming connection from a new client
 * @method connectionCallback
 * @param {Socket} clientSock The incoming client's socket
 */
Server.prototype.connectionCallback = function(clientSock) {

    var newPlayer = new Player();
    var conn = Wasabi.addClient(clientSock);
    Wasabi.addObject(newPlayer);

    // add the player to our player list
    conn.player = newPlayer;

    newPlayer.s2cSetControlObject(conn);
};

/**
 * Browserify scripts for client use
 * @method clientScriptHandler
 */
Server.prototype.clientScriptHandler = function(req, res) {
    if(req.path == '/wasabi_example_client.js') {
        var b = browserify();
        b.add('./src/client.js');
        b.require('./src/client.js');
        b.require('wasabi');

        // Bundle and write to the response when it's done
        b.bundle(function(err, src) { res.send(src); });
    }
};

module.exports = Server;