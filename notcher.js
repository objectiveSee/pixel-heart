var makerjs 			= require('makerjs')


// Helper functions
var pointAsString = function(point) {
	return '('+point[0].toFixed(2)+','+point[1].toFixed(2)+')'
}
var pathAsString = function(path) {
	return 'Origin: '+pointAsString(path.origin)+' End:'+pointAsString(path.end)
}

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
	var newParentModel = makerjs.cloneObject(parent_model)
	newParentModel.models = newModels
	return newParentModel
}

/**
 * Logs a known rectangle.
 */
var logRect = function(rect) {
	var e = makerjs.measure.modelExtents(rect)
	// console.log(e)
	console.log(rect)
}

/**
 * Closes a 3-sides rectangle (eg. one that had 3 paths)
 */
var closeRect = function(rect) {

	var chain = makerjs.model.findSingleChain(rect)

	if ( !chain ) {
		throw new Error('failed to find chain in rect: '+JSON.stringify(rect))
	} else {
		if ( chain.links.length != 3 ) {
			throw new Error('expecting 3 links in chain')
		}
	}
	var points = makerjs.chain.toKeyPoints(chain)
	var new_model = new makerjs.models.ConnectTheDots(true, points)
	return new_model
}

/**
 * mod using negative works with this
 */ 
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n
}

/**
 * Centers a model at the given point.
 */
var centerModelAtPoint = function(model, point) {
  makerjs.model.center(model)
  makerjs.model.moveRelative(model, point)
}

/**
 * Calculate the center point of a path.
 * Optionally can offset the center by a specified `offset` point.
 */
var pathCenterPoint = function(path, offset) {
	if ( typeof offset == 'undefined' ) {
		offset = [0,0]
	}
	var x = (path.origin[0] + path.end[0])/2
	var y = (path.origin[1] + path.end[1])/2    
	return [x-offset[0],y-offset[1]]
}

var TOLERANCE = 0.0001

/**
 * 
 * @returns {Model} a new model object
 */
function notchModel(original_model, options) {

	// TODO: there may be bugs when re-using `original_model` after calling notchModel()
	// not sure if cloneObject() was what we wanted. Just keep an eye out!	
    var model = makerjs.cloneObject(original_model)

	if ( model.models ) {	// todo; maybe this is ok?
		throw new Error('Adding models to model with sub-models already.')
	}  
	model.models = {}
	var points = []
	var boxes = []
    var thickness = (typeof options.thickness != 'undefined') ? options.thickness : 0.1
	var is_walls = (typeof options.is_walls != 'undefined') ? options.is_walls : false
	var notch_width = options.notch_width
    var notch_height = thickness * 2	// double size because half will overhang the model
	var return_notches_without_model = (typeof options.return_notches_without_model != 'undefined') ? 
							options.return_notches_without_model : false
	// default pattern is always "in"
	var pattern = (typeof options.pattern != 'undefined') ? options.pattern : [-1]	
	if (typeof notch_width == 'undefined') {
		throw new Error('notch_width must be specified.')
	}
	if ( thickness == 0 ) {	// no need to notch if no thickness specified
		return model
	}

	// internal state variables    
	var rect_models = []

	makerjs.model.walk(model, {

		onPath: function(walkPathObject) {

			var path = walkPathObject.pathContext            
			var angle = makerjs.angle.ofLineInDegrees(path)
			var length = makerjs.measure.pathLength(path)
			var notch_location_percentage = 0.5	// the % into the path's lenth that the notch is centered on
			var modify_notch = 0

			// we will either subtract or add this rect to the original model based on `pattern`
			var notch_rect = new makerjs.models.Rectangle(notch_width, notch_height)

			if ( makerjs.measure.isAngleEqual(angle, 90, TOLERANCE)
				|| makerjs.measure.isAngleEqual(angle, 270, TOLERANCE )) {

				// vertical part of wall, don't offset

			} else if ( makerjs.measure.isAngleEqual(angle, 0, TOLERANCE )) {
			
				modify_notch = 1

			} else if ( makerjs.measure.isAngleEqual(angle, 180, TOLERANCE )) {

				// wall is on top, so offset in opposite direction since path
				// starts on right and moves left
				modify_notch = -1
			
			} else {
				throw new Error('non multipe of 90 degree angle '+angle)
			}

			/**
			 * Determine the notch location based on any modifications to the notch from generating the
			 * box for it.
			 * TODO: make more robust, for now hard-coding how this works. 
			 */
			if ( modify_notch && (model.prior_turn_modifications || model.next_turn_modifications)) {

				if ( model.prior_turn_modifications && model.next_turn_modifications ) {

					// length is same, but notch is 1 thickness later
					// this is common on "1px" walls in the +y direction
					var notch_offset = length/2 + thickness
					notch_location_percentage = notch_offset/length

				} else if ( model.next_turn_modifications ) {

					// length is shorter by 1 thickness, notch is centered on the original length
					// this is common the "3px" walls such as @ top of heart
					var notch_offset = (length+thickness)/2
					notch_location_percentage = notch_offset/length

				} else if ( model.prior_turn_modifications ) {

					// length is longer by 1 thickness, notch is centered on the original length
					// this is only on the < 1px gap in the middle top of the heart
					var notch_offset = (length+thickness)/2
					notch_location_percentage = notch_offset/length

				} else {

					throw new Error('logic expected only three cases: '
						+model.prior_turn_modifications+', '+model.next_turn_modifications)

				}

				// if doing the top notch, must flip the percentage since it goes from right to left
				if ( modify_notch < 0 ) {
					notch_location_percentage = 1-notch_location_percentage
				}
			}

			var notch_location = makerjs.point.middle(path, notch_location_percentage)

			// console.log('Part '+model.part_id+' has notch percent: '+notch_location_percentage)

			// re-center the rect to be centered on origin
			// var notch_center = pathCenterPoint(path)
            centerModelAtPoint(notch_rect, notch_location)

			// rotate notch to match the slope of the path
			var rect_extents = makerjs.measure.modelExtents(notch_rect)
			makerjs.model.rotate(notch_rect, angle, rect_extents.center)

			// save model in array for later
			rect_models.push(notch_rect)

		}
	})
    
    // merge them all!
    var j = 0
    var notches_only = []
    rect_models.forEach(function(rect) {

    	var pattern_index = j.mod(pattern.length)
        
        // depending on `pattern`, add or subtract the notch
        if ( pattern[pattern_index] < 0 ) { 
          makerjs.model.combineSubtraction(model, rect)
        } else {
          makerjs.model.combineUnion(model, rect)
        }

        // store reference
		model.models['notch'+j] = rect

		j++
    })

    /**
     *
     * Two options for output: if `return_notches_without_model` is true then we only return
     * the closed rectangles for each notch.
     * Else, we return the model which will include the notches are part of the model path
     *
     */
    if ( return_notches_without_model ) {
    	var final_model = {
    		models: {}
    	}
    	var k = 0
    	rect_models.forEach(function(rect) {
    		var closed_rect = closeRect(rect)
    		if ( typeof closed_rect == 'undefined' ) {
    			throw new Error('undefined rect returned')
    		}
    		final_model.models['notch-hole-'+k] = closed_rect
    		k++
    	})

    	return final_model
    } else {
		return model
	}
}

if ( 0 ) {
	
	// Model of pixel heart created by another script, hard-coded here for use in maker playground
	var pixel_heart = {"paths":{"ShapeLine1":{"type":"line","origin":[0,9],"end":[1,9]},"ShapeLine2":{"type":"line","origin":[1,9],"end":[1,10]},"ShapeLine3":{"type":"line","origin":[1,10],"end":[2,10]},"ShapeLine4":{"type":"line","origin":[2,10],"end":[2,11]},"ShapeLine5":{"type":"line","origin":[2,11],"end":[5,11]},"ShapeLine6":{"type":"line","origin":[5,11],"end":[5,10]},"ShapeLine7":{"type":"line","origin":[5,10],"end":[8,10]},"ShapeLine8":{"type":"line","origin":[8,10],"end":[8,11]},"ShapeLine9":{"type":"line","origin":[8,11],"end":[11,11]},"ShapeLine10":{"type":"line","origin":[11,11],"end":[11,10]},"ShapeLine11":{"type":"line","origin":[11,10],"end":[12,10]},"ShapeLine12":{"type":"line","origin":[12,10],"end":[12,9]},"ShapeLine13":{"type":"line","origin":[12,9],"end":[13,9]},"ShapeLine14":{"type":"line","origin":[13,9],"end":[13,6]},"ShapeLine15":{"type":"line","origin":[13,6],"end":[12,6]},"ShapeLine16":{"type":"line","origin":[12,6],"end":[12,5]},"ShapeLine17":{"type":"line","origin":[12,5],"end":[11,5]},"ShapeLine18":{"type":"line","origin":[11,5],"end":[11,4]},"ShapeLine19":{"type":"line","origin":[11,4],"end":[10,4]},"ShapeLine20":{"type":"line","origin":[10,4],"end":[10,3]},"ShapeLine21":{"type":"line","origin":[10,3],"end":[9,3]},"ShapeLine22":{"type":"line","origin":[9,3],"end":[9,2]},"ShapeLine23":{"type":"line","origin":[9,2],"end":[8,2]},"ShapeLine24":{"type":"line","origin":[8,2],"end":[8,1]},"ShapeLine25":{"type":"line","origin":[8,1],"end":[7,1]},"ShapeLine26":{"type":"line","origin":[7,1],"end":[7,0]},"ShapeLine27":{"type":"line","origin":[7,0],"end":[6,0]},"ShapeLine28":{"type":"line","origin":[6,0],"end":[6,1]},"ShapeLine29":{"type":"line","origin":[6,1],"end":[5,1]},"ShapeLine30":{"type":"line","origin":[5,1],"end":[5,2]},"ShapeLine31":{"type":"line","origin":[5,2],"end":[4,2]},"ShapeLine32":{"type":"line","origin":[4,2],"end":[4,3]},"ShapeLine33":{"type":"line","origin":[4,3],"end":[3,3]},"ShapeLine34":{"type":"line","origin":[3,3],"end":[3,4]},"ShapeLine35":{"type":"line","origin":[3,4],"end":[2,4]},"ShapeLine36":{"type":"line","origin":[2,4],"end":[2,5]},"ShapeLine37":{"type":"line","origin":[2,5],"end":[1,5]},"ShapeLine38":{"type":"line","origin":[1,5],"end":[1,6]},"ShapeLine39":{"type":"line","origin":[1,6],"end":[0,6]},"ShapeLine40":{"type":"line","origin":[0,6],"end":[0,9]}}}

	var copied = makerjs.cloneObject(pixel_heart)
    
	var final_model = {
		models: {
			//inner: copied,
			outer: notchModel(pixel_heart, {
				thickness: 0.1,
				notch_width: 0.4,
				return_notches_without_model: true
			})
		}
	}

	module.exports = final_model

} else {
	module.exports.notchModel = notchModel
	module.exports.notchModelsInParent = notchModelsInParent
}
