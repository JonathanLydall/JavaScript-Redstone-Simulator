com.mordritch.mcSim.ticker = function(simulator) {
	this.simulator = simulator;
	this.targetTps = 20; //TODO: Make readable from a config section
	this.tickOnceIncrement = 1; //TODO: Make readable from a config section
	this.isRunning = false;
	this.eventBindings = [];
	this.nextTickAt = 1;
	this.previousTickRunAt = 0;
	
	this.run = function() {
		var thisReferrence = this;
		var timeBetween = 1000/this.targetTps;
		
		setTimeout(
			function() {
				var timeNow = new Date().getTime();
				if (timeNow  >= thisReferrence.nextTickAt) {
					var incrementCount = 0;
					while (thisReferrence.nextTickAt <= timeNow) {
						thisReferrence.nextTickAt += timeBetween;
						incrementCount++;
					}
					if (incrementCount > 1) {
						//Can have feedback option here, EG: ('Dropped ' + (incrementCount-1) + ' ticks');
					}
					thisReferrence.trackTps();
					thisReferrence.nextTickAt = timeNow + timeBetween;

					thisReferrence.tick();
				}
				
				if (thisReferrence.isRunning) thisReferrence.run(); //recursive call
			}
		);
	}
	
	this.trackTps = function() {
		var timeNow = new Date().getTime();
		//$("#tps").text(Math.round(1000/(timeNow-this.previousTickRunAt))); //TODO: have this bindable to a callback or something?
		this.previousTickRunAt = timeNow;
	}
	
	this.tick = function() {
		if (
			//!this.isRunning ||
			!this.simulator.worldIsLoaded
		) {
			this.stopRunning();
			return;
		}
		
		//The order is important, tile entities need to be updated before ticks, to ensure the order matches that of the game 
		this.simulator.World.updateEntities();
		this.simulator.World.tick();
		this.triggerEvent("onTickFinished");
	}
	
	this.toggleRunning = function() {
		if (!this.isRunning) {
			this.startRunning();
		}
		else {
			this.stopRunning();
		}
	}
	
	this.tickOnce = function() {
		this.stopRunning();
		for (var count = 1; count <= this.tickOnceIncrement; count++) {
			this.tick();
		}
		
	}
	
	this.startRunning = function() {
		this.nextTickAt = new Date().getTime();
		this.previousTickRunAt = this.nextTickAt; 
		
		if (
			!this.isRunning &&
			this.simulator.worldIsLoaded			
		) {
			this.isRunning = true;
			this.triggerEvent("startRunning");
			this.run();
		}
		
	}

	this.stopRunning = function() {
		if (this.isRunning) {
			this.triggerEvent("stopRunning");
			this.isRunning = false;
		}
	}
	
	/**
	 * Register a callback event called each time the simulator starts or stops running
	 * 
	 * For example, the gui can register a callback for anytime the simulator is paused or starts running,
	 * it can then react on the call back to change the "is running" UI element.
	 * 
	 */
	this.bind = function(eventName, callBackFunction) {
		this.eventBindings.push([eventName, callBackFunction]);
	}
	
	/**
	 * Calls all callbacks bound to an eventName
	 */
	this.triggerEvent = function(eventName) {
		for (var i=0; i<this.eventBindings.length; i++) {
			if (this.eventBindings[i][0] == eventName) {
				this.eventBindings[i][1]();
			}
		}
	}
}
