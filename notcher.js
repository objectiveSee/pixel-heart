var makerjs 			= require('makerjs')


// Helper functions
var pointAsString = function(point) {
	return '('+point[0].toFixed(2)+','+point[1].toFixed(2)+')'
}
var pathAsString = function(path) {
	return 'Origin: '+pointAsString(path.origin)+' End:'+pointAsString(path.end)
}

// Constants
var POINT_EQUAL_TOLERANCE = 0.001

/**
 * Notches all models stored in the parent model provided
 *
 * @returns {Model} a new model object
 */
var notchModelsInParent = function(parent_model, options) {
	var keys = Object.keys(parent_model.models)
	var newModels = {}
	keys.forEach(function(k) {
		var notched_model = notchModel(parent_model.models[k], options)
		// console.log(JSON.stringify(notched_model,null,' '))
		newModels[k] = notched_model
	})
	var newmodel = JSON.parse(JSON.stringify(parent_model))	// copy model
	newmodel.models = newModels
	return newmodel
}

/**
 * 1 means outward, -1 means inward
 */
function notchDirection(i, pattern) {
	var result = i % pattern.length
	// console.log(i,result,pattern[result])
	return pattern[result]
}

/**
 * TODO: `pattern` logic should evolve to specify the direction of traversal of chain and 
 * the starting point of the traversal for applying direction to. right now you have to know
 * where your model starts and which direction to go when defining the model.
 * 
 * @returns {Model} a new model object
 */
function notchModel(model, options) {

	var points = []
    var offset_notches_by_thickness = true
	var thickness = (typeof options.thickness != 'undefined') ? options.thickness : 0.1
	var is_walls = (typeof options.is_walls != 'undefined') ? options.is_walls : false
	var pattern = (typeof options.pattern != 'undefined') ? options.pattern : [-1]	// default pattern is always "in"
	var notch_width = options.notch_width

	if (typeof notch_width == 'undefined') {
		throw new Error('notch_width must be specified.')
	}

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

			if ( first_time ) {
				// add first origin only
				first_time = false
				points.push(walkPathObject.pathContext.origin)
			}

			var last_end = points[points.length-1]
			var path = walkPathObject.pathContext
			var origin = path.origin
			var end = path.end

			
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
				var length = makerjs.measure.pathLength(path)

				// ASSUME: paths in the pixel heart alternate vertical and horizontal direction
				var isHorizontal = ( makerjs.measure.isAngleEqual(angle,0) || 
									makerjs.measure.isAngleEqual(angle,180) ) 
									? true : false
				if ( isHorizontal && !isEven ) {
					throw new Error('bad swap')
				}

				// find start of notch
				var difference_point = makerjs.point.subtract(end, origin)

				// arbitarily decided that all notches go at 0.3 percent of length
				// TODO: this should get changed to `0.5` later, but for now wanted it to
				// be non-centered so it's easier to visually align.
				var notch_start = (length)*0.3
				if ( is_walls ) {
					notch_start = (length+thickness)*0.3
				}
				// var notch_start = 0.3*length
				var notch_midline_as_percent = notch_start/length

				// logic to calculate notch position is based on percentage of total width
				// and uses scale() to determine the point.
				var notch_width_as_percent = notch_width / length

				var mod_a = makerjs.point.scale(difference_point, notch_midline_as_percent - notch_width_as_percent/2)
				var mod_b = makerjs.point.scale(difference_point, notch_midline_as_percent + notch_width_as_percent/2)

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
				var line_is_inside_model = makerjs.model.isPathInsideModel(line, model)
				var direction_of_notch = notchDirection(i, pattern)
				
				// swap to an outward notch if specified by pattern
				if (( line_is_inside_model &&  direction_of_notch == 1 ) ||
				    ( !line_is_inside_model &&  direction_of_notch == -1)) {

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


// mod using negative works with this
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n
}

/**
 * calculate how much to subtract or add off of each end of the line
 * from previous to current point based on the direction of the next and
 * previoius lines.
 * 
 * This was hard to figure out logically so i broke it out into many
 * conditional statement to cover each case and figrued out the sign on the `stroke`
 * value to use.
 * 
 */
var adjustmentPoint = function(previous, current, next, isHorizontal, stroke) {

    // console.log('previous: '+previous+' current:'+current
                    // +' next:'+next+', horizontal='+isHorizontal)
  
	if ( isHorizontal ) {
     if ( previous[0] < current[0] ) {
        if (next[1] < current[1]) {
          return [stroke,stroke]
        } else {
          return [-stroke, stroke]
        }
      } else {
        
        if (next[1] < current[1]) {
          return [stroke,-stroke]
        } else {
          return [-stroke, -stroke]
        }
      }
	} else {
      if ( previous[1] < current[1] ) {
        if (next[0] < current[0]) {
          return [-stroke,-stroke]
        } else {
          return [-stroke, stroke]
        }
      } else {
        
        if (next[0] < current[0]) {
          return [stroke,-stroke]
        } else {
          return [stroke, stroke]
        }
      }
	
    }
}

// TODO: move to another module, not relavent here
var strokeModel = function(model, stroke) {

	var chain = makerjs.model.findSingleChain(model)
	var points = makerjs.chain.toKeyPoints(chain)	
    var new_points = []
    var length = points.length
	if ( length % 2 != 0 ) {
      throw new Error('invalid chain length')
    }
    var i = 0
    isHorizontal = false
    points.forEach(function(this_point) {

    	var previous_index = (i-1).mod(points.length)
    	var previous_point = points[previous_index]
    	var next_index = (i+1).mod(points.length)
    	var next_point = points[next_index]

		var adjustment_point = adjustmentPoint(previous_point, 
                                               this_point, 
                                               next_point, 
                                               isHorizontal, 
                                               stroke)

		var new_end = makerjs.point.add(this_point, adjustment_point)
        // console.log('new point is '+new_end)    		

		new_points.push(new_end)

        isHorizontal = !isHorizontal
    	i++
    })
    
 	var c = new makerjs.models.ConnectTheDots(true,new_points)
 	return c
}


if ( 0 ) {
	
	// Model of pixel heart created by another script, hard-coded here for use in maker playground
	var pixel_heart = {"paths":{"ShapeLine1":{"type":"line","origin":[0,9],"end":[1,9]},"ShapeLine2":{"type":"line","origin":[1,9],"end":[1,10]},"ShapeLine3":{"type":"line","origin":[1,10],"end":[2,10]},"ShapeLine4":{"type":"line","origin":[2,10],"end":[2,11]},"ShapeLine5":{"type":"line","origin":[2,11],"end":[5,11]},"ShapeLine6":{"type":"line","origin":[5,11],"end":[5,10]},"ShapeLine7":{"type":"line","origin":[5,10],"end":[8,10]},"ShapeLine8":{"type":"line","origin":[8,10],"end":[8,11]},"ShapeLine9":{"type":"line","origin":[8,11],"end":[11,11]},"ShapeLine10":{"type":"line","origin":[11,11],"end":[11,10]},"ShapeLine11":{"type":"line","origin":[11,10],"end":[12,10]},"ShapeLine12":{"type":"line","origin":[12,10],"end":[12,9]},"ShapeLine13":{"type":"line","origin":[12,9],"end":[13,9]},"ShapeLine14":{"type":"line","origin":[13,9],"end":[13,6]},"ShapeLine15":{"type":"line","origin":[13,6],"end":[12,6]},"ShapeLine16":{"type":"line","origin":[12,6],"end":[12,5]},"ShapeLine17":{"type":"line","origin":[12,5],"end":[11,5]},"ShapeLine18":{"type":"line","origin":[11,5],"end":[11,4]},"ShapeLine19":{"type":"line","origin":[11,4],"end":[10,4]},"ShapeLine20":{"type":"line","origin":[10,4],"end":[10,3]},"ShapeLine21":{"type":"line","origin":[10,3],"end":[9,3]},"ShapeLine22":{"type":"line","origin":[9,3],"end":[9,2]},"ShapeLine23":{"type":"line","origin":[9,2],"end":[8,2]},"ShapeLine24":{"type":"line","origin":[8,2],"end":[8,1]},"ShapeLine25":{"type":"line","origin":[8,1],"end":[7,1]},"ShapeLine26":{"type":"line","origin":[7,1],"end":[7,0]},"ShapeLine27":{"type":"line","origin":[7,0],"end":[6,0]},"ShapeLine28":{"type":"line","origin":[6,0],"end":[6,1]},"ShapeLine29":{"type":"line","origin":[6,1],"end":[5,1]},"ShapeLine30":{"type":"line","origin":[5,1],"end":[5,2]},"ShapeLine31":{"type":"line","origin":[5,2],"end":[4,2]},"ShapeLine32":{"type":"line","origin":[4,2],"end":[4,3]},"ShapeLine33":{"type":"line","origin":[4,3],"end":[3,3]},"ShapeLine34":{"type":"line","origin":[3,3],"end":[3,4]},"ShapeLine35":{"type":"line","origin":[3,4],"end":[2,4]},"ShapeLine36":{"type":"line","origin":[2,4],"end":[2,5]},"ShapeLine37":{"type":"line","origin":[2,5],"end":[1,5]},"ShapeLine38":{"type":"line","origin":[1,5],"end":[1,6]},"ShapeLine39":{"type":"line","origin":[1,6],"end":[0,6]},"ShapeLine40":{"type":"line","origin":[0,6],"end":[0,9]}}}

	var expanded_model = strokeModel(pixel_heart, 1)

	var final_model = {
		models: {
			inner: pixel_heart,
			outer: notchModel(expanded_model, {
				thickness: 0.1,
				notch_width: 0.2
			})
			//expanded_model: expanded_model
		}
	}

	module.exports = final_model

} else {
	module.exports.notchModel = notchModel
	module.exports.notchModelsInParent = notchModelsInParent
	module.exports.strokeModel = strokeModel
}
