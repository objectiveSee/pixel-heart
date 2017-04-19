var makerjs 			= require('makerjs')


// Helper functions
var pointAsString = function(point) {
	return '('+point[0].toFixed(2)+','+point[1].toFixed(2)+')'
}
var pathAsString = function(path) {
	return 'Origin: '+pointAsString(path.origin)+' End:'+pointAsString(path.end)
}

var POINT_EQUAL_TOLERANCE = 0.001

// todo: pull out the .move() code from box.js and instead make an "extension" on makerjs.layout
// to have a `layoutModelChildrenInGrid` type function (which can be shared w/ community later)
// it appears the layout is lost for models when we notch them. perhaps their internal coordinates were reset
// could debug that as well if you want but more fun to do the extension approachx

var notchModelsInParent = function(parent_model) {
	var keys = Object.keys(parent_model.models)
	var newModels = {}
	keys.forEach(function(k) {
		var notched_model = notchModel(parent_model.models[k])
		// console.log(JSON.stringify(notched_model,null,' '))
		newModels[k] = notched_model
	})
	var newmodel = JSON.parse(JSON.stringify(parent_model))	// copy model
	newmodel.models = newModels
	return newmodel
}

/**
 *
 * @returns {Model} a new model object
 */
function notchModel(model, thickness) {

	var points = [];
	var thickness = (typeof thickness != 'undefined') ? thickness : 0.1

	// internal state variables
	var first_time = true
	var i = 0
	var isEven = true
	var countPaths = Object.keys(model.paths).length

	// built an array of points by walking through the model path-by-path and 
	// extracing their end_points.
	// ASSUME: the `origin` of each path is equal to the `end` of the previously traversed path


	makerjs.model.walk(model, {

		onPath: function(walkPathObject) {
			// console.log('----')
			if ( first_time ) {
				// add first origin only
				first_time = false
				points.push(walkPathObject.pathContext.origin)
			}

			var last_end = points[points.length-1]
			var path = walkPathObject.pathContext
			var origin = path.origin
			var end = path.end

			// console.log(walkPathObject.pathId+' '+pathAsString(path))
			// console.log('last end is ', last_end)

			
			// check to ensure that path.origin is equal to the `end` point of the previous path
			// if not, try flipping origin and end to see if that fixes it (as observed that 
			// sometimes the points are flipped)

			if ( ! makerjs.measure.isPointEqual(last_end, origin, POINT_EQUAL_TOLERANCE) ) {
				// console.log(':: warning :: path is broken.'+pointAsString(last_end)+' should equal '+pointAsString(origin))
				if ( ! makerjs.measure.isPointEqual(last_end, end, POINT_EQUAL_TOLERANCE) ) {
					console.log(':: error :: path is still broken after flipping origin and end')
				}
				var tmp = origin
				origin = end
				end = tmp
			}

			if ( thickness > 0 ) {	// if 0 there is no notch so dont add unnecessary points

				var angle = makerjs.angle.ofLineInDegrees(path)

				// ASSUME: paths in the pixel heart alternate vertical and horizontal direction
				var isHorizontal = ( makerjs.measure.isAngleEqual(angle,0) || 
									makerjs.measure.isAngleEqual(angle,180) ) 
									? true : false;
				if ( isHorizontal && !isEven ) {
					throw new Error('bad swap')
				}

				var length = makerjs.measure.pathLength(path)

				// find start of notch
				var difference_point = makerjs.point.subtract(end, origin)
				// console.log(difference_point)
				var mod_a = makerjs.point.scale(difference_point, 0.4)
				var mod_b = makerjs.point.scale(difference_point, 0.6)

				var a = makerjs.point.add(origin, mod_a)
				var b = makerjs.point.add(origin, mod_b)

				var notch_point = isHorizontal ? [0,thickness] : [thickness,0]
				var aa = makerjs.point.add(a, notch_point)
				var bb = makerjs.point.add(b, notch_point)

				// build a line to test whether it is inside or outside the shape
				// if outside, swap it so we always have the notches internal
				var line = new makerjs.paths.Line(aa, bb)
				// make test line because there is no `isPointInsideModel` function
				// modify aa/bb if we want to go outside not inside or vice versus
				if ( ! makerjs.model.isPathInsideModel(line, model) ) {
					notch_point = isHorizontal ? [0,-thickness] : [-thickness,0]
					aa = makerjs.point.add(a, notch_point)
					bb = makerjs.point.add(b, notch_point)
				}

				points.push(a,aa,bb,b)
			}

			isEven = !isEven
			points.push(end)
			i++		
		}
	})

	if ( i != countPaths ) {
		console.log('WARNING::: model.walk() was not synchronous')
	}

	return new makerjs.models.ConnectTheDots(true, points)
}

// TODO: move to another module, not relavent here
var strokeModel = function(model, stroke) {

	// Create expanded model
	// 1 is number of edges or something, just use 1
	var NUM_JOINTS = 1
	var expanded_model = makerjs.model.outline(model, stroke, NUM_JOINTS)	

	expanded_model = expanded_model.models['0']	// grab the model, not this wrapper around it
	// console.log('expanded model: '+JSON.stringify(expanded_model))

	//call originate before calling simplify:
	makerjs.model.originate(expanded_model);
	makerjs.model.simplify(expanded_model);	// simplify paths that should be a single path after outline()

	return expanded_model
}


if ( 0 ) {
	
	// Model of pixel heart created by another script, hard-coded here for use in maker playground
	var pixel_heart = {"paths":{"ShapeLine1":{"type":"line","origin":[0,9],"end":[1,9]},"ShapeLine2":{"type":"line","origin":[1,9],"end":[1,10]},"ShapeLine3":{"type":"line","origin":[1,10],"end":[2,10]},"ShapeLine4":{"type":"line","origin":[2,10],"end":[2,11]},"ShapeLine5":{"type":"line","origin":[2,11],"end":[5,11]},"ShapeLine6":{"type":"line","origin":[5,11],"end":[5,10]},"ShapeLine7":{"type":"line","origin":[5,10],"end":[8,10]},"ShapeLine8":{"type":"line","origin":[8,10],"end":[8,11]},"ShapeLine9":{"type":"line","origin":[8,11],"end":[11,11]},"ShapeLine10":{"type":"line","origin":[11,11],"end":[11,10]},"ShapeLine11":{"type":"line","origin":[11,10],"end":[12,10]},"ShapeLine12":{"type":"line","origin":[12,10],"end":[12,9]},"ShapeLine13":{"type":"line","origin":[12,9],"end":[13,9]},"ShapeLine14":{"type":"line","origin":[13,9],"end":[13,6]},"ShapeLine15":{"type":"line","origin":[13,6],"end":[12,6]},"ShapeLine16":{"type":"line","origin":[12,6],"end":[12,5]},"ShapeLine17":{"type":"line","origin":[12,5],"end":[11,5]},"ShapeLine18":{"type":"line","origin":[11,5],"end":[11,4]},"ShapeLine19":{"type":"line","origin":[11,4],"end":[10,4]},"ShapeLine20":{"type":"line","origin":[10,4],"end":[10,3]},"ShapeLine21":{"type":"line","origin":[10,3],"end":[9,3]},"ShapeLine22":{"type":"line","origin":[9,3],"end":[9,2]},"ShapeLine23":{"type":"line","origin":[9,2],"end":[8,2]},"ShapeLine24":{"type":"line","origin":[8,2],"end":[8,1]},"ShapeLine25":{"type":"line","origin":[8,1],"end":[7,1]},"ShapeLine26":{"type":"line","origin":[7,1],"end":[7,0]},"ShapeLine27":{"type":"line","origin":[7,0],"end":[6,0]},"ShapeLine28":{"type":"line","origin":[6,0],"end":[6,1]},"ShapeLine29":{"type":"line","origin":[6,1],"end":[5,1]},"ShapeLine30":{"type":"line","origin":[5,1],"end":[5,2]},"ShapeLine31":{"type":"line","origin":[5,2],"end":[4,2]},"ShapeLine32":{"type":"line","origin":[4,2],"end":[4,3]},"ShapeLine33":{"type":"line","origin":[4,3],"end":[3,3]},"ShapeLine34":{"type":"line","origin":[3,3],"end":[3,4]},"ShapeLine35":{"type":"line","origin":[3,4],"end":[2,4]},"ShapeLine36":{"type":"line","origin":[2,4],"end":[2,5]},"ShapeLine37":{"type":"line","origin":[2,5],"end":[1,5]},"ShapeLine38":{"type":"line","origin":[1,5],"end":[1,6]},"ShapeLine39":{"type":"line","origin":[1,6],"end":[0,6]},"ShapeLine40":{"type":"line","origin":[0,6],"end":[0,9]}}};

	var expanded_model = strokeModel(pixel_heart, 0.322)

	var final_model = {
		models: {
			inner: pixel_heart,
			outer: notchModel(expanded_model, 0.1)
		}
	}

	module.exports = final_model

} else {
	module.exports.notchModel = notchModel
	module.exports.notchModelsInParent = notchModelsInParent
	module.exports.strokeModel = strokeModel
}
