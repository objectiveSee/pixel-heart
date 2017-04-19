var makerjs 			= require('makerjs')

function LayoutGrid(parent_model, options) {

	var max_width = (typeof options.max_width == 'undefined' ? 0.1 : options.max_width)
	var XSPACING = (typeof options.x_spacing == 'undefined' ? 0.1 : options.x_spacing)
	var YSPACING = (typeof options.y_spacing == 'undefined' ? 0.1 : options.y_spacing)

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