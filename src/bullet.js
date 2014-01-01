var Wasabi = require('wasabi');
var Particle = require('./particle.js');
var XBOUND = 320, YBOUND = 460;
var BULLET_SPEED = 500;
function Bullet (x, y, angle) {
    this.x = x + Math.cos(angle) * 50;
    this.y = y + Math.sin(angle) * 50;
    this.xvel = Math.cos(angle) * BULLET_SPEED;
    this.yvel = Math.sin(angle) * BULLET_SPEED;
    this.exploded = false;
}

Bullet.prototype.serialize = function (desc) {
    desc.uint('x', 10); // a 16 bit unsigned integer named x
    desc.uint('y', 10); // a 16 bit unsigned integer named y
    desc.sint('xvel', 10); // an 8 bit signed integer named xvel
    desc.sint('yvel', 10); // an 8 bit signed integer named yvel
    desc.uint('exploded', 1); // 1 bit unsigned integer, used as a boolean
}

Bullet.prototype.render = function(ctx) {
    ctx.fillStyle = '#555555';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, 2*Math.PI);
    ctx.fill();
}

Bullet.prototype.run = function (deltaSeconds) {
    if(this.exploded)
        return false;

    if(this.x > XBOUND || this.x < 0) {
        this.xvel = -this.xvel;
        this.x = Math.min(Math.max(this.x, 0), XBOUND);
    }
   
    if(this.y > YBOUND || this.y < 0) {
        this.yvel = -this.yvel;
        this.y = Math.min(Math.max(this.y, 0), YBOUND);
    }

    this.x = Math.max(0, Math.min(XBOUND, this.x));
    this.y = Math.max(0, Math.min(YBOUND, this.y));

    this.x += this.xvel * deltaSeconds;
    this.y += this.yvel * deltaSeconds;

    var allObjects = Wasabi._getAllObjects();
    for(var k in allObjects) {
        var obj = allObjects[k];
        var distSquared = Math.pow(Math.abs(this.x - obj.x), 2) + Math.pow(Math.abs(this.y - obj.y), 2);
        if(obj.hasOwnProperty('health') && distSquared < 1225) {
            this.exploded = true;

            if(!this.wsbIsGhost) {
                obj.health -= .25;
                Wasabi.removeObject(this);
                this.s2cExplode(this.x, this.y, this.xvel, this.yvel);
            }
            return;
        }
    }
};

Bullet.prototype.s2cExplode = function s2cExplode(x, y, xvel, yvel) {
    var explosionAngle = Math.atan2(yvel, xvel) - Math.PI;
    var angle;
    for (var i = 0; i < 20; i++) {
        angle = explosionAngle + Math.random() - .5;
        this._game.addParticle(new Particle(x, y, angle));
    }
};

Wasabi.addClass(Bullet);

module.exports = Bullet;
