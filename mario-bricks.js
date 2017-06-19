var makerjs 			= require('makerjs')

var BRICK_HEIGHT = 8.2
var RATIO = 1/.6
var BRICK_WIDTH = BRICK_HEIGHT * RATIO

var addBricksToBoxes = function(boxes) {

	var newModels = {
		models: {

		}
	}
	var i = 0
	var keys = Object.keys(boxes.models)
	// console.log(keys)

	var brick = new makerjs.models.Rectangle(BRICK_WIDTH, BRICK_HEIGHT)

	keys.forEach(function(key) {
		var model = boxes.models[key]
		// console.log('model='+JSON.stringify(model))
		// console.log(model)

		var extents = makerjs.measure.modelExtents(model)
		// console.log(extents)
		var wide = Math.ceil(extents.width / BRICK_WIDTH)
		var tall = Math.ceil(extents.height / BRICK_HEIGHT)
		console.log('size is '+wide+' by '+tall+', center is '+extents.center)

		var wall = makerjs.layout.cloneToBrick(brick, wide, tall, 0)

		makerjs.model.center(wall)
		makerjs.model.move(wall, extents.low)

		// if ( i == 1 ) {
			newModels.models['blocks-'+i] = wall
		// }
		i++
	})
	newModels.layer = 'blue'
	//JSON.stringify(
	console.log(newModels)
	return newModels
}

module.exports = addBricksToBoxes