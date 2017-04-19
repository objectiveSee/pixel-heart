var makerjs 			= require('makerjs')

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

/**
 * Internal function, see makeBoxWallsAlongModelPerimeter.
 * 
 * @returns {Array} array of new models
 */
var makeBoxesAlongModel = function(model, depth) {

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

	points.forEach(function(point) {

		if ( is_first ) {
			is_first = false
		} else {

			var length = makerjs.measure.pointDistance(point, previous_point)
			
			if ( !length ) {
				throw new Error('no length is bad!')
			}
			length = Math.abs(length)	// we only care about real distance for box dimensions

			var options = {
				width: length,
				height: depth
			}

			var box = Box(options)
			models.push(box)

		}
		previous_point = point

	})
	// console.log(models)
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
var makeBoxWallsAlongModelPerimeter = function(model, depth) {
	var modelsArray = makeBoxesAlongModel(model, depth)
	var modelsObject = arrayToObjectModels(modelsArray)
	var final_model = {
		models: modelsObject
	}
	return final_model
}

if ( 0 ) {

	// Model of pixel heart created by another script, hard-coded here for use in maker playground
	var pixel_heart = {"paths":{"ShapeLine1":{"type":"line","origin":[0,9],"end":[1,9]},"ShapeLine2":{"type":"line","origin":[1,9],"end":[1,10]},"ShapeLine3":{"type":"line","origin":[1,10],"end":[2,10]},"ShapeLine4":{"type":"line","origin":[2,10],"end":[2,11]},"ShapeLine5":{"type":"line","origin":[2,11],"end":[5,11]},"ShapeLine6":{"type":"line","origin":[5,11],"end":[5,10]},"ShapeLine7":{"type":"line","origin":[5,10],"end":[8,10]},"ShapeLine8":{"type":"line","origin":[8,10],"end":[8,11]},"ShapeLine9":{"type":"line","origin":[8,11],"end":[11,11]},"ShapeLine10":{"type":"line","origin":[11,11],"end":[11,10]},"ShapeLine11":{"type":"line","origin":[11,10],"end":[12,10]},"ShapeLine12":{"type":"line","origin":[12,10],"end":[12,9]},"ShapeLine13":{"type":"line","origin":[12,9],"end":[13,9]},"ShapeLine14":{"type":"line","origin":[13,9],"end":[13,6]},"ShapeLine15":{"type":"line","origin":[13,6],"end":[12,6]},"ShapeLine16":{"type":"line","origin":[12,6],"end":[12,5]},"ShapeLine17":{"type":"line","origin":[12,5],"end":[11,5]},"ShapeLine18":{"type":"line","origin":[11,5],"end":[11,4]},"ShapeLine19":{"type":"line","origin":[11,4],"end":[10,4]},"ShapeLine20":{"type":"line","origin":[10,4],"end":[10,3]},"ShapeLine21":{"type":"line","origin":[10,3],"end":[9,3]},"ShapeLine22":{"type":"line","origin":[9,3],"end":[9,2]},"ShapeLine23":{"type":"line","origin":[9,2],"end":[8,2]},"ShapeLine24":{"type":"line","origin":[8,2],"end":[8,1]},"ShapeLine25":{"type":"line","origin":[8,1],"end":[7,1]},"ShapeLine26":{"type":"line","origin":[7,1],"end":[7,0]},"ShapeLine27":{"type":"line","origin":[7,0],"end":[6,0]},"ShapeLine28":{"type":"line","origin":[6,0],"end":[6,1]},"ShapeLine29":{"type":"line","origin":[6,1],"end":[5,1]},"ShapeLine30":{"type":"line","origin":[5,1],"end":[5,2]},"ShapeLine31":{"type":"line","origin":[5,2],"end":[4,2]},"ShapeLine32":{"type":"line","origin":[4,2],"end":[4,3]},"ShapeLine33":{"type":"line","origin":[4,3],"end":[3,3]},"ShapeLine34":{"type":"line","origin":[3,3],"end":[3,4]},"ShapeLine35":{"type":"line","origin":[3,4],"end":[2,4]},"ShapeLine36":{"type":"line","origin":[2,4],"end":[2,5]},"ShapeLine37":{"type":"line","origin":[2,5],"end":[1,5]},"ShapeLine38":{"type":"line","origin":[1,5],"end":[1,6]},"ShapeLine39":{"type":"line","origin":[1,6],"end":[0,6]},"ShapeLine40":{"type":"line","origin":[0,6],"end":[0,9]}}};
	var modelsArray = makeBoxesAlongModel(pixel_heart, 1.4, 10)	// depth is made up
	var modelsObject = arrayToObjectModels(modelsArray)

	var final_model = makeBoxWallsAlongModelPerimeter(pixel_heart, 1.4,10)
	module.exports = final_model

} else {
	module.exports.Box = Box
	module.exports.makeBoxWallsAlongModelPerimeter = makeBoxWallsAlongModelPerimeter
}
