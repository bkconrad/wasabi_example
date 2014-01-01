var Wasabi = require('wasabi');

/**
 * Shared representation of the game world
 * @class Game
 */
function Game(context) {
	this._context = context;
	this._controlObject = null;
	this._particles = [];
}

/**
 * Run the simulation
 * @method run
 * @param {Number} deltaSeconds The number of seconds to simulate
 */
Game.prototype.run = function(deltaSeconds) {
	if(this._context) {
		this._context.fillStyle = '#FFFFFF';
		this._context.fillRect(0, 0, 320, 460);
	}
	
	var allObjects = Wasabi._getAllObjects();
    for(var serial in allObjects) {
        obj = allObjects[serial];
        obj.run(deltaSeconds);

        if(this._context) {
        	obj.render(this._context);
        }
    }

    if(this._context) {
	    for(var i = this._particles.length - 1; i >= 0; i--) {
	        particle = this._particles[i];
	        particle.run(deltaSeconds);

	        if(particle.life <= 0) {
	        	this._particles.splice(i, 1);
	        	continue;
	        }

	        particle.render(this._context);
	    }
    }
}; 

/**
 * Add a particle to the game. Only used client-side
 */
Game.prototype.addParticle = function(particle) {
	this._particles.push(particle);
}; 

module.exports = Game;