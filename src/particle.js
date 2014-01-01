var Wasabi = require('wasabi');
var XBOUND = 320, YBOUND = 460;
var PARTICLE_SPEED = 50;
var PARTICLE_LIFETIME = 2.0;
function Particle (x, y, angle) {
    var speed = PARTICLE_SPEED * Math.random();
    this.x = x;
    this.y = y;
    this.xvel = Math.cos(angle) * speed;
    this.yvel = Math.sin(angle) * speed;
    this.life = PARTICLE_LIFETIME;
}

Particle.prototype.render = function(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, ' + this.life/PARTICLE_LIFETIME + ')';
    ctx.fillRect(this.x, this.y, 1, 1);
}

Particle.prototype.run = function (deltaSeconds) {
    if(this.exploded)
        return false;
    
    if(this.x > XBOUND || this.x < 0 || this.y > YBOUND || this.y < 0) {
        this.life = 0;
    }

    this.x += this.xvel * deltaSeconds;
    this.y += this.yvel * deltaSeconds;
    this.life -= deltaSeconds;
}

module.exports = Particle;
