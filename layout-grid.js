var makerjs 			= require('makerjs')


var XSPACING = 0.1
var YSPACING = 0.1

function LayoutGrid(parent_model, max_width) {

	// var newModel = JSON.parse(JSON.stringify(parent_model))

	// console.log(Object.keys(newModel.models))

	var xpos = 0
	var ypos = 0
	var maxheight = 0

	Object.keys(parent_model.models).forEach(function(key) {

		var model = parent_model.models[key]
		console.log(JSON.stringify(model, null, '\t'))

		var extents = makerjs.measure.modelExtents(model)
		var model_width = extents.width

		if ( extents.height > maxheight ) {	// track height model in current horizontal line
			maxheight = extents.height
		}

		console.log(model_width, max_width, xpos)

		if ( xpos + model_width > max_width ) {
			// wrap line by increasing y and resetting xpost and maxheight
			xpos = 0
			ypos += maxheight + YSPACING
			maxheight = 0
		}

		makerjs.model.move(model, [xpos,ypos])
		xpos += model_width + XSPACING

	})

}

module.exports = LayoutGrid