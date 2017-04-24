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

var pathCenterPoint = function(path, offset) {
	var x = (path.origin[0] + path.end[0])/2
	var y = (path.origin[1] + path.end[1])/2    
	return [x-offset[0],y-offset[1]]
}

/**
 * TODO: there may be bugs when re-using `original_model` after calling notchModel()
 * not sure if cloneObject() was what we wanted. Just keep an eye out!
 * 
 * @returns {Model} a new model object
 */
function notchModel(original_model, options) {

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
    var notch_height = thickness*2	// double size because half will overhang the model
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

			// build a rect that centers on the path and overhangs on eachside by desired notch size
			// we will either subtract or add this rect to the original model based on `pattern`
			var notch_rect = new makerjs.models.Rectangle(notch_width, notch_height)

			// re-center the rect to be centered on origin
			var notch_center = pathCenterPoint(path, [notch_width/2,notch_height/2])
			makerjs.model.move(notch_rect, notch_center)

			// rotate notch to match the slope of the path
			var rect_extents = makerjs.measure.modelExtents(notch_rect)
			makerjs.model.rotate(notch_rect, angle, rect_extents.center)

			// save model in array for later
			rect_models.push(notch_rect)

		}
	})
    
    if ( return_notches_without_model ) {
      model = { // overwrite as empty and only add notches below 
        models: {}
      }	
    }
    // merge them all!
    var j = 0
    rect_models.forEach(function(rect) {

      if ( ! return_notches_without_model ) {
        
        // depending on `pattern`, add or subtract the notch
        var pattern_index = j.mod(pattern.length)
        if ( pattern[pattern_index] < 0 ) { 
          makerjs.model.combineSubtraction(model, rect)
        } else {
          makerjs.model.combineUnion(model, rect)
        }

      }
      model.models['notch'+j] = rect
      j++
    })

	return model
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


if ( 1 ) {
	
	// Model of pixel heart created by another script, hard-coded here for use in maker playground
	var pixel_heart = {"paths":{"ShapeLine1":{"type":"line","origin":[0,9],"end":[1,9]},"ShapeLine2":{"type":"line","origin":[1,9],"end":[1,10]},"ShapeLine3":{"type":"line","origin":[1,10],"end":[2,10]},"ShapeLine4":{"type":"line","origin":[2,10],"end":[2,11]},"ShapeLine5":{"type":"line","origin":[2,11],"end":[5,11]},"ShapeLine6":{"type":"line","origin":[5,11],"end":[5,10]},"ShapeLine7":{"type":"line","origin":[5,10],"end":[8,10]},"ShapeLine8":{"type":"line","origin":[8,10],"end":[8,11]},"ShapeLine9":{"type":"line","origin":[8,11],"end":[11,11]},"ShapeLine10":{"type":"line","origin":[11,11],"end":[11,10]},"ShapeLine11":{"type":"line","origin":[11,10],"end":[12,10]},"ShapeLine12":{"type":"line","origin":[12,10],"end":[12,9]},"ShapeLine13":{"type":"line","origin":[12,9],"end":[13,9]},"ShapeLine14":{"type":"line","origin":[13,9],"end":[13,6]},"ShapeLine15":{"type":"line","origin":[13,6],"end":[12,6]},"ShapeLine16":{"type":"line","origin":[12,6],"end":[12,5]},"ShapeLine17":{"type":"line","origin":[12,5],"end":[11,5]},"ShapeLine18":{"type":"line","origin":[11,5],"end":[11,4]},"ShapeLine19":{"type":"line","origin":[11,4],"end":[10,4]},"ShapeLine20":{"type":"line","origin":[10,4],"end":[10,3]},"ShapeLine21":{"type":"line","origin":[10,3],"end":[9,3]},"ShapeLine22":{"type":"line","origin":[9,3],"end":[9,2]},"ShapeLine23":{"type":"line","origin":[9,2],"end":[8,2]},"ShapeLine24":{"type":"line","origin":[8,2],"end":[8,1]},"ShapeLine25":{"type":"line","origin":[8,1],"end":[7,1]},"ShapeLine26":{"type":"line","origin":[7,1],"end":[7,0]},"ShapeLine27":{"type":"line","origin":[7,0],"end":[6,0]},"ShapeLine28":{"type":"line","origin":[6,0],"end":[6,1]},"ShapeLine29":{"type":"line","origin":[6,1],"end":[5,1]},"ShapeLine30":{"type":"line","origin":[5,1],"end":[5,2]},"ShapeLine31":{"type":"line","origin":[5,2],"end":[4,2]},"ShapeLine32":{"type":"line","origin":[4,2],"end":[4,3]},"ShapeLine33":{"type":"line","origin":[4,3],"end":[3,3]},"ShapeLine34":{"type":"line","origin":[3,3],"end":[3,4]},"ShapeLine35":{"type":"line","origin":[3,4],"end":[2,4]},"ShapeLine36":{"type":"line","origin":[2,4],"end":[2,5]},"ShapeLine37":{"type":"line","origin":[2,5],"end":[1,5]},"ShapeLine38":{"type":"line","origin":[1,5],"end":[1,6]},"ShapeLine39":{"type":"line","origin":[1,6],"end":[0,6]},"ShapeLine40":{"type":"line","origin":[0,6],"end":[0,9]}}}

	var expanded_model = strokeModel(pixel_heart, 1)

	var final_model = {
		models: {
			inner: pixel_heart,
			outer: notchModel(expanded_model, {
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
	module.exports.strokeModel = strokeModel
}
