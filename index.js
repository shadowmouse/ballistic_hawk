var b = BABYLON;
   			var sceneObjects = {};
   			var sceneCameras = {};
   			var sceneLights = {};
            var uGravConst = 6.674*Math.pow(10,-11);
            var earthMass = 5.972*Math.pow(10,24);
            var au = 149597871000;
            var scaleFactor = 1/au;
   			var createScene = function () {
   				// Create Scene Object
   				var scene = new b.Scene(engine);
   				// Set Scene Background
   				scene.clearColor = new b.Color3(0.1,0.1,0.1);
   				// Create Player Camera
   				var camera = new b.FreeCamera("playerCamera", new b.Vector3(0,100,(-1*100)), scene);
   				sceneCameras.playerCamera = camera;
   				//Point Camera at Origin
   				camera.setTarget(b.Vector3.Zero());
   				// Attach Camera to Canvas
   				camera.attachControl(canvas, false);
   				// Create Scene Light and Point Upwards
   				var light = new b.HemisphericLight("light1", new b.Vector3(0,1,0), scene);
   				sceneLights.mainLight = light;
   				// Dim the Light
   				light.intensity = .5;

 				// Create Objects
   				createObjects(b,scene);
   				return scene;
   			};

   			var createObjects = function (b,scene) {
               sceneObjects.fixedSphere = generateObject(scene, {
                  name : "fixedSphere",
                  mass : 332946 * earthMass,
                  size : 10,
                  z : 0,
                  isFixed: true,
                  ignore: false
               });

               fsm = new b.StandardMaterial("texture1", scene);
               fsm.diffuseColor = new b.Color3(0.99,0.98,0);
               fsm.emissiveColor = new b.Color3(0.99,0.98,0);
               sceneObjects.fixedSphere.material = fsm;

               sceneObjects.orbitSphere = generateObject(scene, {
                  name : "orbitSphere",
                  mass : earthMass,
                  size : 1,
                  z : 50,
                  isFixed: false,
                  ignore : false
               });
               sceneObjects.orbitSphere.velocity = generateCircularOrbitalVector(sceneObjects.orbitSphere, sceneObjects.fixedSphere); 
               console.log(sceneObjects.orbitSphere.velocity);
               sceneObjects.orbitSphere2 = generateObject(scene, {
                  name : "orbitSphere2",
                  mass : 2 * earthMass,
                  size : 2,
                  z : 100,
                  isFixed: false,
                  ignore : false
               });
               sceneObjects.orbitSphere2.velocity = generateCircularOrbitalVector(sceneObjects.orbitSphere2, sceneObjects.fixedSphere);
               console.log(sceneObjects.orbitSphere2.velocity);
   			};

            var generateObject = function (scene, options) {

               if(typeof options.mass == "undefined") { options.mass = 1; }
               if(typeof options.startingVelocity == "undefined") { options.startingVelocity = [0,0,0]; }
               if(typeof options.startingAcceleration == "undefined") { options.startingAcceleration = [0,0,0]; }
               if(typeof options.isFixed == "undefined") { options.isFixed = false; }
               if(typeof options.ignore == "undefined") { options.ignore = false; }
               if(typeof options.x == "undefined") { options.x = 0; }
               if(typeof options.y == "undefined") { options.y = 0; }
               if(typeof options.z == "undefined") { options.z = 0; }
               if(typeof options.density == "undefined") { options.density = 1; }
               if(typeof options.name == "undefined") { options.name = "newObject"; }
               if(typeof options.size == "undefined") { options.size = 1 }
               var newObject = BABYLON.Mesh.CreateSphere(options.name, 16, options.size, scene);
               newObject.position.z = options.z;
               newObject.position.y = options.y;
               newObject.position.x = options.x;
               newObject.velocity = options.startingVelocity;
               newObject.acceleration = options.startingAcceleration;
               newObject.isFixed = options.isFixed;
               newObject.ignore = options.ignore;
               newObject.mass = options.mass;

               return newObject;
            };

   			var setCameraTarget = function (object) {
   				//Point Camera at Object
   				sceneCameras.playerCamera.setTarget(object.position);
   			}

            var updateObjectPositions = function (availableObjects) {
               Object.keys(availableObjects).forEach(function (key, index, array) {
                  var targetObject = availableObjects[key];
                  updateObjectPosition(targetObject, availableObjects);
               });
            };

   			var updateObjectPosition = function (object, affectingObjects) {

               if(object.isFixed) { return false;}

               // Get Object Initial Condition
               var startingVelocity = [object.velocity[0], object.velocity[1], object.velocity[2]];
               var startingAcceleration = [object.acceleration[0], object.acceleration[1], object.acceleration[2]];
               var accelX = 0;
               var accelY = 0;
               var accelZ = 0;

               if(Array.isArray(affectingObjects)) {
                  // Sum Affecting Forces
                  affectingObjects.forEach(function (affectingObject, index, array) {
                     if(affectingObject == object) {} else { // Ignore Self
                        // Get Radius to Object
                        var radius = object.position.subtract(affectingObject.position).length();
                        // Calculate Force On Object
                        var gravForce = ((-1) * (object.mass * affectingObject.mass * uGravConst))/(radius*radius);
                        // Get the Force Unit Vector
                        var unitVector = object.position.subtract(affectingObject.position).normalize();
                        // Update Object Accleration Data
                        accelX += (unitVector.x * gravForce);
                        accelY += (unitVector.y * gravForce);
                        accelZ += (unitVector.z * gravForce);
                     }
                  });
               } else {
                   Object.keys(affectingObjects).forEach(function (key, index, array) {
                     var affectingObject = affectingObjects[key];
                     if(affectingObject == object) {} else { // Ignore Self
                        // Get Radius to Object
                        var radius = object.position.subtract(affectingObject.position).length();
                        // Calculate Force On Object
                        var gravForce = ((-1) * (object.mass * affectingObject.mass * uGravConst))/(radius*radius);
                        // Get the Force Unit Vector
                        var unitVector = object.position.subtract(affectingObject.position).normalize();
                        // Update Object Accleration Data
                        accelX += (unitVector.x * gravForce);
                        accelY += (unitVector.y * gravForce);
                        accelZ += (unitVector.z * gravForce);
                     }
                  });
               }
               object.acceleration = [accelX, accelY, accelZ];
               // Update Object Velocity Data
               object.velocity = [(object.velocity[0] + object.acceleration[0]),(object.velocity[1] + object.acceleration[1]),(object.velocity[2] + object.acceleration[2])];
               // Update Object Postition based on New Velocity
               object.position.x = object.position.x + (object.velocity[0]);
               object.position.y = object.position.y + (object.velocity[1]);
               object.position.z = object.position.z + (object.velocity[2]);
               //console.log(object.position, object.velocity, object.acceleration, gravForce);

   			};

   			var updateDebugOutput = function (object, object2) {
   				var xPosOutput = document.getElementById("xPosOutput");
   				var yPosOutput = document.getElementById("yPosOutput");
   				var zPosOutput = document.getElementById("zPosOutput");
   				var distOutput = document.getElementById("distOutput");
               var dxPosOutput = document.getElementById("dxPosOutput");
               var dyPosOutput = document.getElementById("dyPosOutput");
               var dzPosOutput = document.getElementById("dzPosOutput");

   				xPosOutput.innerHTML = "x : "+object.position.x.toFixed(2);
   				yPosOutput.innerHTML = "y : "+object.position.y.toFixed(2);
   				zPosOutput.innerHTML = "z : "+object.position.z.toFixed(2);
   				distOutput.innerHTML = "r : "+object.position.subtract(object2.position).length().toFixed(2);
               dxPosOutput.innerHTML = "x : "+object.position.subtract(object2.position).normalize().x.toFixed(2);
               dyPosOutput.innerHTML = "y : "+object.position.subtract(object2.position).normalize().y.toFixed(2);
               dzPosOutput.innerHTML = "z : "+object.position.subtract(object2.position).normalize().z.toFixed(2);

   			};
            var getCircularOrbitalVelocity = function (orbiter, orbitee) {
               var radius = orbiter.position.subtract(orbitee.position).length();
               var vOrbit = Math.sqrt((uGravConst * orbitee.mass)/(radius));
               return vOrbit;
            };

            var generateCircularOrbitalVector = function (orbiter, orbitee, angle) {
               var vOrbit = getCircularOrbitalVelocity(orbiter, orbitee);
               var unitVector = orbiter.position.subtract(orbitee.position).normalize();

               return [(vOrbit * unitVector.z),(vOrbit * unitVector.x), (vOrbit * unitVector.y)];
            };


   			var scene = createScene();

   			engine.runRenderLoop(function () {
               sceneObjects.orbitSphere.position.x += 10000000/au;
   				//updateObjectPositions(sceneObjects);
   				updateDebugOutput(sceneObjects.orbitSphere, sceneObjects.fixedSphere);
   				scene.render();
   			});

   			window.addEventListener("resize", function () {
   				engine.resize();
   			});

   			window.addEventListener("click", function () {
   				var pickResult = scene.pick(scene.pointerX, scene.pointerY);
   				if(pickResult.hit){
   					setCameraTarget(pickResult.pickedMesh);
   				}
   			});