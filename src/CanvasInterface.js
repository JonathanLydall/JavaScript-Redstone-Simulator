/**
 * Acts as a proxy to all convas 2d context calls
 * 
 * Originally I was unaware of .translate to set up an offset, so was manually using an offset in my forward
 * calls. However, I also discovered that certain setting calls are expensive, for example setting the font.
 * 
 * With the above in mind, it is being kept as it does improve performance considerably.
 * 
 * @param {Object} modelView	The modelview which has this canvas  
 */

com.mordritch.mcSim.CanvasInterface = function() {
	this.contextValues = {};

	this.settings = [
		'fillStyle',
		'font',
		'globalAlpha',
		'globalCompositeOperation',
		'lineCap',
		'lineJoin',
		'lineWidth',
		'miterLimit',
		'shadowBlur',
		'shadowColor',
		'shadowOffsetX',
		'shadowOffsetY',
		'strokeStyle',
		'textAlign',
		'textBaseline'
	];
	
	this.setContext = function(context) {
		this.context = context;
		
		for (var i=0; i<this.settings.length; i++) {
			var settingName = this.settings[i];
			this.contextValues[settingName] = this.context[settingName];
			this[settingName] = this.contextValues[settingName];
		}
	}
	
	/**
	 * Called by every method to ensure the canvas' properties are in sync with this interface
	 * 
	 * This also caches our setting calls to the context object, avoiding setting the values
	 * unless they have actually changed. Certain setting changes are quite "slow", for example
	 * setting the context's font. However, all the settings seem to have a certain amount of overhead
	 * and this improves our performance.
	 */
	this.setProperties = function() {
		for (var i=0; i<this.settings.length; i++) {
			var settingName = this.settings[i];
			if (this[settingName] != this.contextValues[settingName]) {
				this.context[settingName] = this[settingName];
				this.contextValues[settingName] = this[settingName];
			}
		} 
	}
	
	//Standard 2D context functions follow:
	
	this.bezierCurveTo = function(cp1x, cp1y, cp2x, cp2y, x, y) {
		this.setProperties();
		return this.context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
	}
	
	this.arc = function(x, y, radius, startAngle, endAngle, anticlockwise) {
		this.setProperties();
		return this.context.arc(x, y, radius, startAngle, endAngle, anticlockwise);
	}
	
	this.arcTo = function(x1, y1, x2, y2, radius) {
		this.setProperties();
		return this.context.arcTo(x1, y1, x2, y2, radius);
	}
	
	this.beginPath = function() {
		this.setProperties();
		return this.context.beginPath();
	}
	
	this.clearRect = function(x, y, w, h) {
		this.setProperties();
		return this.context.clearRect(x, y, w, h);
	}
	
	this.clip = function() {
		this.setProperties();
		return this.context.clip();
	}
	
	this.closePath = function() {
		this.setProperties();
		return this.context.closePath();
	}
	
	this.createImageData = function(a1, a2) {
		this.setProperties();
		return this.context.createImageData(a1, a2);
	}
	
	this.createLinearGradient = function(x0, y0, x1, y1) {
		this.setProperties();
		return this.context.createLinearGradient(x0, y0, x1, y1);
	}
	
	this.createPattern = function(image, repetition) {
		this.setProperties();
		return this.context.createPattern(image, repetition);
	}
	
	this.createRadialGradient = function(x0, y0, r0, x1, y1, r1) {
		this.setProperties();
		return this.context.createRadialGradient(x0, y0, r0, x1, y1, r1);
	}
	
	this.drawImage = function(pSrc, sx, sy, sw, sh, dx, dy, dw, dh) {
		this.setProperties();
		return this.context.drawImage(pSrc, sx, sy, sw, sh, dx, dy, dw, dh);
	}
	
	this.fill = function() {
		this.setProperties();
		return this.context.fill();
	}
	
	this.fillRect = function(x, y, w, h) {
		this.setProperties();
		return this.context.fillRect(x, y, w, h);
	}
	
	this.fillText = function(text, x, y, maxWidth) {
		this.setProperties();
		return this.context.fillText(text, x, y, maxWidth);
	}
	
	this.getImageData = function(sx, sy, sw, sh) {
		this.setProperties();
		return this.context.getImageData(sx, sy, sw, sh);
	}
	
	this.isPointInPath = function(x, y) {
		this.setProperties();
		return this.context.isPointInPath(x, y);
	}
	
	this.lineTo = function(x, y) {
		this.setProperties();
		return this.context.lineTo(x, y);
	}
	
	this.measureText = function(text) {
		this.setProperties();
		return this.context.measureText(text);
	}
	
	this.moveTo = function(x, y) {
		this.setProperties();
		return this.context.moveTo(x, y);
	}
	
	this.putImageData = function(imagedata, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
		this.setProperties();
		return this.context.putImageData(imagedata, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
	}
	
	this.quadraticCurveTo = function(cp1x, cp1y, x, y) {
		this.setProperties();
		return this.context.quadraticCurveTo(cp1x, cp1y, x, y);
	}
	
	this.rect = function(x, y, w, h) {
		this.setProperties();
		return this.context.rect(x, y, w, h);
	}
	
	this.restore = function() {
		this.setProperties();
		return this.context.restore();
	}
	
	this.rotate = function(angle) {
		this.setProperties();
		return this.context.rotate(angle);
	}
	
	this.save = function() {
		this.setProperties();
		return this.context.save();
	}
	
	this.scale = function(x, y) {
		this.setProperties();
		return this.context.scale(x, y);
	}
	
	this.setTransform = function(m11, m12, m21, m22, dx, dy) {
		this.setProperties();
		return this.context.setTransform(m11, m12, m21, m22, dx, dy);
	}
	
	this.stroke = function() {
		this.setProperties();
		return this.context.stroke();
	}
	
	this.strokeRect = function(x, y, w, h) {
		this.setProperties();
		return this.context.strokeRect(x, y, w, h);
	}
	
	this.strokeText = function(text, x, y, maxWidth) {
		this.setProperties();
		return this.context.strokeText(text, x, y, maxWidth);
	}
	
	this.transform = function(m11, m12, m21, m22, dx, dy) {
		this.setProperties();
		return this.context.transform(m11, m12, m21, m22, dx, dy);
	}
	
	this.translate = function(x, y) {
		this.setProperties();
		return this.context.translate(x, y);
	}
}
