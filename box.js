var makerjs 			= require('makerjs')

/** 
 * Module for making 3D boxes out of cut pieces of 2D material, such as wood.
 */


/**
 * mod using negative works with this
 */ 
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n
}


function Box(options) {

	// NOTE can also use http://microsoft.github.io/maker.js/docs/api/classes/makerjs.models.rectangle.html
	// to simplify code if you so desire

    // "path" is an array of movements needed to make the box. It alternates vertical and horizontal
    // movements. Each movement is the amount specified in the array, for example `-3` would be moving
    // 3 units in the negative direction.
    // moves in counter clockwise direction from 0,0
	var path = [1*options.width,1*options.height,
                -1*options.width,-1*options.height]
    if ( ! options.width || !options.height ) {
    	throw new Error('bad width or height'+ JSON.stringify(options))
    }
  
  	// go clockwise starting from leftmost point
	var points = []
	var firstPoint = [0,0]
	points.push(firstPoint)

	var moveHorizontal = true	// alternate horizontal and vertical movements to form pixel heart

	path.forEach(function(p) {

		var previous_point = points[points.length-1]
		var point_to_add;

		if ( moveHorizontal ) {
			point_to_add = [p,0]					
		} else {
			point_to_add = [0,p]
		}
		var e = makerjs.point.add(previous_point, point_to_add)
		points.push(e)	
		
		// flip direction each time
		moveHorizontal = !moveHorizontal
	})


	var pathModel = new makerjs.models.ConnectTheDots(true, points)
    
	return pathModel

}

/*
 * Function assumes that this is either verical or horizontal, else you should use path.slop()
 * type logic to get an angle to ensure this assumption in more robust cases
 */
var isHorizontalPath = function(pointa, pointb) {
	var distancex = Math.abs(pointb[0]-pointa[0])
	var distancey = Math.abs(pointb[1]-pointa[1])

	// for safety!
	if ( Math.abs( distancey - distancex) < 1 ) {
		console.log('Warn: Potential illogical path direction '+pointa+pointb)
	}

	if ( distancey > distancex ) {
		return false
	}
	return true
}

/**
 * Paradigm is to have `index` be the end point of the path you are making a box for.
 */
var getTurnInfo = function(points, index) {

	var len = points.length

	if ( len.mod(2) == 1 ) {
		throw new Error('length of box path should be even')
	}

	var inext = (index+1).mod(len)
	var iorg = (index-1).mod(len)
	var iprev = (index-2).mod(len)
	var iend = (index).mod(len)
	var r = {
		end: points[iend],
		next: points[inext],
		origin: points[iorg],
		previous: points[iprev]
	}

	var was_left_turn = false
	var will_turn_left = false
	var is_horizontal = isHorizontalPath(r.origin, r.end)

	var flip = false

	if ( is_horizontal ) {

		flip = r.origin[0] > r.end[0] ? true : false
		was_left_turn = (r.origin[1] < r.previous[1]) ? true : false
		will_turn_left = (r.end[1] < r.next[1]) ? true : false

	} else {

		flip = r.origin[1] > r.end[1] ? true : false
		was_left_turn = (r.origin[0] > r.previous[0]) ? true : false
		will_turn_left = (r.end[0] > r.next[0]) ? true : false

	}

	if ( flip ) {
		was_left_turn = !was_left_turn
		will_turn_left = !will_turn_left
	}

	r.had_turned_left = was_left_turn
	r.will_turn_left = will_turn_left
	r.is_horizontal = is_horizontal
	r.flipped = flip

	// console.log(r)

	return r
}

/**
 * Internal function, see makeBoxWallsAlongModelPerimeter.
 * 
 * @returns {Array} array of new models
 */
var makeBoxesAlongModel = function(model, depth, thickness) {

	thickness = (typeof thickness == 'undefined' ) ? 0.0 : thickness

	// var should_wrap = (typeof max_width == 'undefined') ? false : true
	// console.log('wrapping ='+should_wrap)
	// console.log(model)

	var chain = makerjs.model.findSingleChain(model)
	//console.log(chain)
	
	var points = makerjs.chain.toKeyPoints(chain)
	//console.log(points)

	var models = []
	var is_first = true
	var previous_point
	var horizontal = true // initial value of this must match the order of paths.
	if ( points.length.mod(2) != 0 ) {	// this validates the value of `horiztonal` being correct to match first path
		throw new Error('must adjust for loop start based on assumption of length '+points.length)
	}

	// TODO: skipping first (i=0) is ok? Check mod in getPoints()
	for ( var i = 1; i < points.length+1; i++ ) {		

		var t = getTurnInfo(points, i)
		if ( t.is_horizontal != horizontal ) {
			throw new Error('bad horizontal: '+JSON.stringify(t,null,'\t'))
		}
		horizontal = !horizontal


		var length = Math.abs(makerjs.measure.pointDistance(t.origin, t.end))	// abs(): we only care about real distance for box dimensions
		if ( !length ) {
			throw new Error('no length is bad!')
		}

		
		var prior_turn_modifications = t.had_turned_left ? thickness : 0
		var next_turn_modifications = t.will_turn_left ? 0 : -thickness
		var required_side_length = length + prior_turn_modifications + next_turn_modifications

		var log_string = ' '
		if ( prior_turn_modifications ) {
			log_string += 'origin ('+prior_turn_modifications+') '
		}
		if ( next_turn_modifications ) {
			log_string += 'end ('+next_turn_modifications+') '
		}
		if ( !next_turn_modifications && !prior_turn_modifications ) {
			log_string += 'none'
		}
		// Debug log of length of each side
		console.log(i+':\t'+required_side_length.toFixed(2)+' mm \t:'+ log_string)


		// ASSUME: Each box wall has one male notch and one female notch
		var options = {
			width: required_side_length,
			height: depth,
			origin_x: prior_turn_modifications			
		}

		var box = Box(options)

		box.prior_turn_modifications = prior_turn_modifications
		box.next_turn_modifications = next_turn_modifications
		// box.part_id = i+'('+length.toFixed(1)+')'
		box.part_id = i.toString()

		models.push(box)

	}

    return models

}

var arrayToObjectModels = function(modelsArray) {
	var x = {}
	var i = 0
    // modelsArray = [modelsArray[0]]
	modelsArray.forEach(function(m) {
		x['model'+i] = m
		i++
	})
	return x
}

/**
 * Accepts a model and creates the boxes needed to make the sides of a box in which 
 * the model is the bottom. These boxes would be 90 degrees to the model when this is 
 * physically assembled.
 *
 * @returns {Model} a new model containing the box side wall models.
 */
var makeBoxWallsAlongModelPerimeter = function(model, depth, thickness) {

	// generate vertical walls that could join the the path of model @ 90 degrees
	var modelsArray = makeBoxesAlongModel(model, depth, thickness)


	// convert to the format needed for makerjs
	var modelsObject = arrayToObjectModels(modelsArray)
	var final_model = {
		models: modelsObject
	}
	return final_model
}

if ( 0 ) {

	var pixel_heart = require('./stroke-model.js')

	// Model of pixel heart created by another script, hard-coded here for use in maker playground
	// var pixel_heart = {"paths":{"ShapeLine1":{"type":"line","origin":[0,9],"end":[1,9]},"ShapeLine2":{"type":"line","origin":[1,9],"end":[1,10]},"ShapeLine3":{"type":"line","origin":[1,10],"end":[2,10]},"ShapeLine4":{"type":"line","origin":[2,10],"end":[2,11]},"ShapeLine5":{"type":"line","origin":[2,11],"end":[5,11]},"ShapeLine6":{"type":"line","origin":[5,11],"end":[5,10]},"ShapeLine7":{"type":"line","origin":[5,10],"end":[8,10]},"ShapeLine8":{"type":"line","origin":[8,10],"end":[8,11]},"ShapeLine9":{"type":"line","origin":[8,11],"end":[11,11]},"ShapeLine10":{"type":"line","origin":[11,11],"end":[11,10]},"ShapeLine11":{"type":"line","origin":[11,10],"end":[12,10]},"ShapeLine12":{"type":"line","origin":[12,10],"end":[12,9]},"ShapeLine13":{"type":"line","origin":[12,9],"end":[13,9]},"ShapeLine14":{"type":"line","origin":[13,9],"end":[13,6]},"ShapeLine15":{"type":"line","origin":[13,6],"end":[12,6]},"ShapeLine16":{"type":"line","origin":[12,6],"end":[12,5]},"ShapeLine17":{"type":"line","origin":[12,5],"end":[11,5]},"ShapeLine18":{"type":"line","origin":[11,5],"end":[11,4]},"ShapeLine19":{"type":"line","origin":[11,4],"end":[10,4]},"ShapeLine20":{"type":"line","origin":[10,4],"end":[10,3]},"ShapeLine21":{"type":"line","origin":[10,3],"end":[9,3]},"ShapeLine22":{"type":"line","origin":[9,3],"end":[9,2]},"ShapeLine23":{"type":"line","origin":[9,2],"end":[8,2]},"ShapeLine24":{"type":"line","origin":[8,2],"end":[8,1]},"ShapeLine25":{"type":"line","origin":[8,1],"end":[7,1]},"ShapeLine26":{"type":"line","origin":[7,1],"end":[7,0]},"ShapeLine27":{"type":"line","origin":[7,0],"end":[6,0]},"ShapeLine28":{"type":"line","origin":[6,0],"end":[6,1]},"ShapeLine29":{"type":"line","origin":[6,1],"end":[5,1]},"ShapeLine30":{"type":"line","origin":[5,1],"end":[5,2]},"ShapeLine31":{"type":"line","origin":[5,2],"end":[4,2]},"ShapeLine32":{"type":"line","origin":[4,2],"end":[4,3]},"ShapeLine33":{"type":"line","origin":[4,3],"end":[3,3]},"ShapeLine34":{"type":"line","origin":[3,3],"end":[3,4]},"ShapeLine35":{"type":"line","origin":[3,4],"end":[2,4]},"ShapeLine36":{"type":"line","origin":[2,4],"end":[2,5]},"ShapeLine37":{"type":"line","origin":[2,5],"end":[1,5]},"ShapeLine38":{"type":"line","origin":[1,5],"end":[1,6]},"ShapeLine39":{"type":"line","origin":[1,6],"end":[0,6]},"ShapeLine40":{"type":"line","origin":[0,6],"end":[0,9]}}};
	// var modelsArray = makeBoxesAlongModel(pixel_heart, 1.4, 10)	// depth is made up
	// var modelsObject = arrayToObjectModels(modelsArray)

	var final_model = makeBoxWallsAlongModelPerimeter(pixel_heart, 1.4, 0.1)
	module.exports = final_model

} else {
	module.exports.Box = Box
	module.exports.makeBoxWallsAlongModelPerimeter = makeBoxWallsAlongModelPerimeter
}
