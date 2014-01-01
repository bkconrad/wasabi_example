var Game = require('./game.js')
  , Player = require('./player.js')
  , Wasabi = require('wasabi')
  ;

var PROCESS_CONNECTIONS_INTERVAL = 1000/15;
function Client() {
    this._game = null;

    this._lastRun = null;
    this._lastProcessConnections = Date.now();

    this._keyMap = { };

    this._bytesReceived = 0;
    this._lastBandwidthMeasurement = 0;
    this._lastBandwidthMeasurementTime = Date.now();
}

Client.prototype.init = function init() {

    // create a canvas and get the context
    this._canvas = document.createElement('canvas');
    this._canvas.width = 320;
    this._canvas.height = 460;
    this._canvas.style.margin = 'auto';
    this._canvas.style.display = 'block';
    this._context = this._canvas.getContext('2d');
    document.body.appendChild(this._canvas);

    // create our game
    this._game = new Game(this._context);

    // connect to the server
    this._sock = new WebSocket('ws://' + window.location.hostname + ':1234');

    this._sock.onerror = function(e) {
        console.log(e);
    };

    var client = this;
    this._sock.onopen = function() {
        requestAnimationFrame(function() { client.frame(); });

        // add the socket as the connection to the server
        Wasabi.addServer(client._sock);

        Wasabi.on('receive', function(connection, data) {
            client._bytesReceived += data.length;
        });
    }

    // set the _game property for objects when they're received 
    Wasabi.on('clientGhostCreate', function(obj) {
        obj._game = client._game;
    });

    // set up the key handlers
    window.onkeydown = this.keyDownHandler.bind(this);
    window.onkeyup = this.keyUpHandler.bind(this);
    window.onclick = this.clickHandler.bind(this);

}

Client.prototype.frame = function frame() {
    var serial, obj, allObjects;
    var now = Date.now();

    // make sure to call processConnections on the client, too
    if(now - this._lastProcessConnections >= PROCESS_CONNECTIONS_INTERVAL) {
        Wasabi.processConnections();
        this._lastProcessConnections = now;
    }

    // this is a typical simulation update loop, passing in the time elapsed
    // since the last run
    this._lastRun = this._lastRun || now;
    var deltaSeconds = (now - this._lastRun) / 1000;
    this._game.run(deltaSeconds);
    this._lastRun = now;


    // render debug info
    var objects = Wasabi._getAllObjects();
    var count = 0;
    var k;
    for(k in objects) {
        if(objects.hasOwnProperty(k)) {
            count++;
        }
    }

    this._game._context.fillStyle = 'rgba(10, 10, 10, 0.5)';
    this._game._context.fillRect(10, 10, 100, 100);

    this._game._context.textBaseline = 'top';
    this._game._context.fillStyle = '#EEEEEE';
    this._game._context.fillText('bandwidth: ' + this._lastBandwidthMeasurement + 'B/s', 15, 15);
    this._game._context.fillText('objects: ' + count, 15, 25);

    if(now - this._lastBandwidthMeasurementTime > 1000) {
        this._lastBandwidthMeasurement = Math.round(1000 * this._bytesReceived / (now - this._lastBandwidthMeasurementTime));
        this._bytesReceived = 0;
        this._lastBandwidthMeasurementTime = now;
    }

    // set up the next frame
    requestAnimationFrame(Client.prototype.frame.bind(this));
}

Client.prototype.keyDownHandler = function(e) {
    var key = e.keyCode;
    var x = this.xvel;
    var y = this.yvel;
    var SPEED = 300;

    if(this._keyMap[key]) {
        // the key was already pressed
        return;
    }

    this._keyMap[key] = true;

    // W
    if(key === 87) {
        this._game._controlObject.rpcMoveY(-1);
        this._game._controlObject.moveY(-1);
    }

    // S
    if(key === 83) {
        this._game._controlObject.rpcMoveY(1);
        this._game._controlObject.moveY(1);
    }

    // A
    if(key === 65) {
        this._game._controlObject.rpcMoveX(-1);
        this._game._controlObject.moveX(-1);
    }
    
    // D
    if(key === 68) {
        this._game._controlObject.rpcMoveX(1);
        this._game._controlObject.moveX(1);
    }
};

Client.prototype.keyUpHandler = function(e) {
    var key = e.keyCode;
    this._keyMap[key] = false;
    
    // W
    if(key === 87 || key === 83) {
        this._game._controlObject.rpcMoveY(0);
    }

    // A
    if(key === 65 || key === 68) {
        this._game._controlObject.rpcMoveX(0);
    }
};

Client.prototype.clickHandler = function(e) {
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var currentElement = this._canvas;
    var player = this._game._controlObject;

    do{
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    }
    while(currentElement = currentElement.offsetParent)

    x = event.pageX - totalOffsetX - player.x;
    y = event.pageY - totalOffsetY - player.y;

    var angle = Math.atan2(y, x);
    this._game._controlObject.c2sFire(angle / Math.PI);
};

module.exports = Client;