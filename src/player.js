var XBOUND = 320, YBOUND = 460;
var PLAYER_SIZE = 30;
var PLAYER_SPEED = 350;
var Bullet = require('./bullet.js');
var Particle = require('./particle.js');
var Wasabi = require('wasabi');

function Player () {
    this.x = Math.floor(Math.random() * 400);
    this.y = Math.floor(Math.random() * 400);
    this.health = 1.0;
    this.xvel = 0;
    this.yvel = 0;
    this.exploded = false;
}

Player.prototype.serialize = function (desc) {
    desc.uint('x', 10);       // a 10 bit unsigned integer named x
    desc.uint('y', 10);       // a 10 bit unsigned integer named y
    desc.sint('xvel', 9);     // a 9 bit signed integer named xvel
    desc.sint('yvel', 9);     // a 9 bit signed integer named yvel
    desc.float('health', 16); // a normalized 16 bit signed float named health
    desc.uint('exploded', 1); // a 1 bit unsigned integer, used as a boolean
}

Player.prototype.render = function(ctx) {

    // the local player is a little brighter
    if(this._game._controlObject == this) {
        ctx.fillStyle = '#444444';
    } else {
        ctx.fillStyle = '#000000';
    }

    // draw the player
    ctx.beginPath();
    ctx.arc(this.renderX, this.renderY, PLAYER_SIZE, 0, 2*Math.PI);
    ctx.fill();

    // draw the healthbar
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(this.renderX - PLAYER_SIZE, this.renderY + PLAYER_SIZE, this.health * 60, 3);
}

Player.prototype.run = function (deltaSeconds) {
    if(this.exploded) {
        return;
    }

    // clip the player to the game area
    if(this.x > XBOUND - PLAYER_SIZE || this.x < PLAYER_SIZE) {
        this.xvel = 0;
        this.x = Math.min(Math.max(this.x, PLAYER_SIZE), XBOUND - PLAYER_SIZE);
    }
   
    if(this.y > YBOUND - PLAYER_SIZE || this.y < PLAYER_SIZE) {
        this.yvel = 0;
        this.y = Math.min(Math.max(this.y, PLAYER_SIZE), YBOUND - PLAYER_SIZE);
    }

    // on the server, we update the real x and y
    if(!this.wsbIsGhost) {
        this.x += (this.xvel * deltaSeconds) | 0;
        this.y += (this.yvel * deltaSeconds) | 0;
    }

    // the client will guess when the player has exploded as well
    if(this.health <= 0) {
        this.exploded = true;

        // but only the server will actually make it explode and respawn
        if(!this.wsbIsGhost) {
            this.s2cExplode(this.x, this.y);
            this.x = Math.floor(Math.random() * 400);
            this.y = Math.floor(Math.random() * 400);
            this.health = 1.0;
            this.exploded = false;
        }
    }

    // on the client, we'll do some CSP and interpolation
    if(this.wsbIsGhost) {

        // if there is no render position, we set it to the real position
        if(this.renderX === undefined || this.renderY === undefined) {
            this.renderX = this.x;
            this.renderY = this.y;
        }

        // the client will do CSP on the render position rather than the real position
        this.renderX += (this.xvel * deltaSeconds) | 0;
        this.renderY += (this.yvel * deltaSeconds) | 0;

        // when the render position is different than the real position, we
        // gradually move the render position towards the real position
        var interpolationSpeed = PLAYER_SPEED * deltaSeconds;
        this.renderX += Math.max(Math.min(this.x - this.renderX, interpolationSpeed), -interpolationSpeed);
        this.renderY += Math.max(Math.min(this.y - this.renderY, interpolationSpeed), -interpolationSpeed);
    }
}

// real movement functions, used to do CSP while invoking control RPCs
Player.prototype.moveX = function moveX(x) {
    x = Math.min(Math.max(x, -1), 1);
    this.xvel = PLAYER_SPEED * x;
};

Player.prototype.moveY = function moveY(y) {
    y = Math.min(Math.max(y, -1), 1);
    this.yvel = PLAYER_SPEED * y;
};


// notice that the control RPCs are passthroughs to the real movement functions
Player.prototype.rpcMoveX = function rpcMoveX(x) {
    this.moveX(x);
};

Player.prototype.rpcMoveY = function rpcMoveY(y) {
    this.moveY(y);
};

// tell the client that this is his player object
Player.prototype.s2cSetControlObject = function s2cSetControlObject() {
    this._game._controlObject = this;
};

// tell the server that we'd like to shoot now
Player.prototype.c2sFire = function c2sFire(angle) {
    var bullet = new Bullet(this.x, this.y, angle * Math.PI);
    Wasabi.addObject(bullet);
};

// boom!
Player.prototype.s2cExplode = function s2cExplode(x, y) {
    var angle;
    for (var i = 0; i < 200; i++) {
        angle = Math.random() * Math.PI * 2;
        this._game.addParticle(new Particle(x + Math.cos(angle) * 30, y + Math.sin(angle) * 30, angle));
    }
    this.exploded = false;
    this.renderX = undefined;
    this.renderY = undefined;
};

Wasabi.addClass(Player);

module.exports = Player;
