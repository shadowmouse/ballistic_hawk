var BallisticHawk = (function (vec3, quat, numbers) {

	var stellarConstants = {
		au : 149597871000,
		solarMass : 1.989 * Math.pow(10, 32),
		earthMass : 5.972 * Math.pow(10,24),
		lunarMass : 7.34767309 * Math.pow(10,22),
		uGravConst : 6.674*Math.pow(10,-11),
		earthRadius : 6371000,
		lunarRadius : 1737500,
		solarRadius : 6.955*Math.pow(10,8)
	};

	var CurrentBodyIndex = 0;

	var BHSystem = function BHSystem() {

		var now = new Date();
		this.name = now.getTime()+"System";
		this.bodies = {};
		this.gravBodies = {};
		this.nonGravBodies = {};
		this.position = vec3.fromValues(0,0,0);
		this.velocity = vec3.fromValues(0,0,0);
		this.acceleration = vec3.fromValues(0,0,0);
		return this;
	};

	BHSystem.prototype.className = "BHSystem";

	BHSystem.prototype.getSystemBodies = function () {
		return this.bodies;
	};

	BHSystem.prototype.getSystemGravBodies = function () {
		return this.gravBodies;
	};

	BHSystem.prototype.getSystemNonGravBodies = function () {
		return this.nonGravBodies;
	};

	BHSystem.prototype.getSystemMass = function () {
		var systemMass = 0;
		var systemBodies = this.bodies;
		Object.keys(systemBodies).forEach(function (key, index, array) {
			var body = systemBodies[key];
			systemMass += body.get('mass');
		});
		return systemMass;
	};

	BHSystem.prototype.calculateCircularOrbitalVelocity = function (orbiter, orbitee) {
		console.log(orbiter.get('name'),orbiter.get('position'), orbitee.get('name'), orbitee.get('position'));
       var radius = vec3.distance(orbiter.get('position'), orbitee.get('position'));
       //console.log("Radius", radius);
       //var mu = constants.uGravConst * orbiter.mass;
       //console.log(mu);
       //var vOrbit = Math.sqrt(mu*((2/radius)-(1/radius)));
       var vOrbit = Math.sqrt((stellarConstants.uGravConst * (orbitee.get('mass') + orbiter.get('mass')))/(radius));
       //console.log(vOrbit);
       return vOrbit;
    };

    BHSystem.prototype.generateCircularOrbitalVector = function (orbiter, orbitee, scale) {
		// Get Velocity
		var vOrbit = this.calculateCircularOrbitalVelocity(orbiter, orbitee);
		vOrbit = vOrbit * scale;
		// Get Orbital Radius
		var distanceVector = vec3.create();
		vec3.subtract(distanceVector, orbiter.get('position'), orbitee.get('position'));

		// Get Unit Vector Towards Orbit Center
		var unitVector = vec3.create();
		vec3.normalize(unitVector, distanceVector);

		vec3.transformQuat(unitVector, unitVector, quat.fromValues(0.5,-0.5,0.5,0.5));
		//Rotate Unit Vector to Orbital Direction



       return vec3.fromValues((vOrbit * unitVector[0]),(vOrbit * unitVector[1]),(vOrbit * unitVector[2]));
    };

	BHSystem.prototype.get = function (key) {
		if(key == "mass") { return this.getSystemMass(); }
		return this[key];
	};

	BHSystem.prototype.set = function (key, value) {
		this[key] = value;
		return this[key];
	};

	BHSystem.prototype.getBody = function (id, type) {
		if(typeof type == "undefined") {type = "any";}

		switch(type) {
			case 'grav' : {
				if(typeof this.gravBodies[id] == 'undefined') {return null;}
				return this.gravBodies[id];
			} break;
			case 'non' : {
				if(typeof this.nonGravBodies[id] == 'undefined') {return null;}
				return this.nonGravBodies[id];
			} break;
			case 'key' : {
				var retBod;
				var systemBodies = this.bodies;
				Object.keys(systemBodies).forEach(function (key, index, array) {
					var obj = systemBodies[key];
					if(obj.key == id) {retBod = obj;}
				});
				return retBod;
			} break;
			default : {
				if(typeof this.bodies[id] == 'undefined') {return null;}
				return this.bodies[id];
			} break;
		}
	};

	BHSystem.prototype.stepSimulation = function (timeRatio, viewScale) {
		var system = this;
		var systemBodies = this.bodies;
		var systemGravBodies = this.gravBodies;
		Object.keys(systemBodies).forEach(function (key, index, array) {
			var updateBody = systemBodies[key];
			system.updatePosition(updateBody, systemGravBodies, timeRatio);
			var renderFunction = system.get('renderUpdateFunction');
			var scaledPosition = system.getBodyAbsolutePosition(updateBody, viewScale);
			renderFunction(scaledPosition, updateBody);
			if(updateBody.className == "BHSystem") { updateBody.stepSimulation(timeRatio, viewScale); }

		});
	};

	BHSystem.prototype.updatePosition = function (targetBody, affectingBodies, timeRatio) {
		var self = this;
		if(targetBody.isFixed) {return;}
		/* -- Non-Threaded Processing of Position Update -- */
		var acclerationSummer = function (key, index, array) {
			var affectingBody = affectingBodies[key];
			if(affectingBody == targetBody) { } else { // Ignore Self

				// Get Radius to Object
				var radius = vec3.distance(targetBody.position, affectingBody.position);
				if(radius < 1) {radius = 1;}
				// Calculate Force On Object
				//console.log("Equation Debug : ", targetBody, targetBody.acceleration, targetBody.get('mass'), affectingBody.get('mass'), stellarConstants.uGravConst, radius, Math.pow(radius ,2));
				var gravForce = ((-1) * (targetBody.get('mass') * affectingBody.get('mass') * stellarConstants.uGravConst))/Math.pow(radius ,2);
				// a = M/F
				var gravAccel = gravForce/targetBody.get('mass');
				//if(gravAccel > 0.00001) { // Ignore distant forces
					//console.log("Force & Accel", gravForce, gravAccel);
					// Get the Force Unit Vector
					var distanceVector = vec3.create();
					vec3.subtract(distanceVector, targetBody.position, affectingBody.position);
					var unitVector = vec3.create();
					vec3.normalize(unitVector, distanceVector);
					// Update Object Accleration Data
					updateAccleration[0] += (unitVector[0] * gravAccel);
					updateAccleration[1] += (unitVector[1] * gravAccel);
					updateAccleration[2] += (unitVector[2] * gravAccel);
				//}
				
			}
		};

		//Numerical Time Compression (Upper Limit 1000 before frame drop (60,000 : 1 effective ratio at 60FPS))
		for(var i = 0; i < timeRatio; i++) {
			
			var updateAccleration = [0,0,0];
			//console.log("One", targetBody.velocity, targetBody.acceleration, updateAccleration);
			// Calculate Gravitational Acclerations
			Object.keys(affectingBodies).forEach(acclerationSummer);
			//console.log("Two", targetBody.velocity, targetBody.acceleration, updateAccleration);
			// Add Thrust Acclerations
			updateAccleration[0] += targetBody.acceleration[0];
			updateAccleration[1] += targetBody.acceleration[1];
			updateAccleration[2] += targetBody.acceleration[2];
			//console.log("Three", targetBody.velocity, targetBody.acceleration, updateAccleration);
			// Update Velocity Data
			targetBody.velocity[0] = targetBody.velocity[0] + updateAccleration[0];
			targetBody.velocity[1] = targetBody.velocity[1] + updateAccleration[1];
			targetBody.velocity[2] = targetBody.velocity[2] + updateAccleration[2];
			//console.log("Four", targetBody.velocity, targetBody.acceleration, updateAccleration);
			// Update Position Data
			targetBody.position[0] += targetBody.velocity[0] + (targetBody.acceleration[0]/2);
			targetBody.position[1] += targetBody.velocity[1] + (targetBody.acceleration[1]/2);
			targetBody.position[2] += targetBody.velocity[2] + (targetBody.acceleration[2]/2);
			
			/*
			targetBody.position[0] += self.position[0];
			targetBody.position[1] += self.position[1];
			targetBody.position[2] += self.position[2];
			*/
			//console.log(targetBody.position);
		}
		//*/
	};

	BHSystem.prototype.addBody = function (body) {
		if(typeof body == "undefined") {return false;}
		if(typeof body.name == "undefined") {return false;}
		if(body.isGravBody) {
			this.nonGravBodies[body.name] = body;
		} else {
			this.gravBodies[body.name] = body;
		}
		this.bodies[body.name] = body;
	};

	BHSystem.prototype.getBodyAbsolutePosition= function (body, scale) {
		var system = this;
		var pos = vec3.create();
		//console.log(system.get('position'), body.get('position'));
		vec3.add(pos, system.get('position'), body.get('position'));
		vec3.scale(pos, pos, scale);

		return pos;
	};
	BHSystem.prototype.getBodyAbsolutePositions = function (scale) {
		var bodies = this.bodies;
		var positions = {};
		var self = this;
		Object.keys(bodies).forEach(function (key, index, array) {
			var body = bodies[key];
			positions[key] = self.getBodyAbsolutePosition(body, scale);
		});
		return positions;
	};


	/* --- BHBody Components --- */

	var BHBody = function () {
		var now = new Date();
		this.name = now.getTime()+"Body";
		this.position = vec3.fromValues(0,0,0);
		this.velocity = vec3.fromValues(0,0,0);
		this.acceleration = vec3.fromValues(0,0,0);
		this.mass = 0;
		this.radius = 0;
		this.isGravBody = false;
		return this;
	};

	BHBody.prototype.className = "BHBody";

	BHBody.prototype.get = function (key) {
		return this[key];
	};

	BHBody.prototype.set = function (key, value) {
		this[key] = value;
		return this[key];
	};

	return {
		stellarConstants : function () { return stellarConstants; },
		createSystem : function (options) {
			var newSystem = new BHSystem();
			return newSystem;
		},
		createBody : function (options) {
			var newBody = new BHBody();
			Object.keys(options).forEach(function (key, index, array) {
				newBody[key] = options[key];
			});
			return newBody;
		}
	};

})(vec3, quat, numbers);