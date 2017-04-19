var makerjs 			= require('makerjs')


var XSPACING = 0.1
var YSPACING = 0.1

function LayoutGrid(parent_model, max_width) {

	var xpos = 0
	var ypos = 0
	var maxheight = 0

	Object.keys(parent_model.models).forEach(function(key) {

		var model = parent_model.models[key]

		var extents = makerjs.measure.modelExtents(model)
		var model_width = extents.width

		if ( extents.height > maxheight ) {	// track height model in current horizontal line
			maxheight = extents.height
		}

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