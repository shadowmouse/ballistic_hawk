
self.addEventListener('message',function(payload) {

	importScripts("js/gl-matrix-min-64.js");

	var parameters = payload.data;
	var targetBody = parameters.targetBody;
	var timeRatio = parameters.timeRatio;
	var affectingBodies = parameters.affectingBodies;
	var uGravConst = parameters.uGravConst;

	var acclerationSummer = function (key, index, array) {
		var affectingBody = affectingBodies[key];
		if(affectingBody == targetBody) { } else { // Ignore Self
			// Get Radius to Object
			var radius = vec3.distance(targetBody.position, affectingBody.position);
			if(radius < 1) {radius = 1;}
			// Calculate Force On Object
			//console.log("Equation Debug : ", targetBody.mass, affectingBody.mass, uGravConst, radius, Math.pow(radius ,2));
			var gravForce = ((-1) * (targetBody.mass * affectingBody.mass * uGravConst))/Math.pow(radius ,2);
			// a = M/F
			var gravAccel = gravForce/targetBody.mass;
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
		}
	};

	//Brute Force Time Compression -- Research Alternatives
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

		//console.log("Five", targetBody.position, targetBody.velocity, targetBody.acceleration);
	}
	
	self.postMessage({'position' : targetBody.position, 'velocity' : targetBody.velocity, 'acceleration' : targetBody.acceleration});
}, false);