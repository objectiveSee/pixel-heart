var makerjs 			= require('makerjs')


/**
 * Lays out all sub-models of `parent_model` in a grid.
 * Optionally can locate all models starting above the y position of `position_above_model`
 */
function LayoutGrid(parent_model, options, position_above_model) {

	var max_width = (typeof options.max_width == 'undefined' ? 0.1 : options.max_width)
	var XSPACING = (typeof options.x_spacing == 'undefined' ? 0.1 : options.x_spacing)
	var YSPACING = (typeof options.y_spacing == 'undefined' ? 0.1 : options.y_spacing)
	var grid_spacing_between_models = (typeof options.grid_spacing_between_models == 'undefined' 
		? 0.3 : options.grid_spacing_between_models)


	var xpos = 0
	var ypos = 0
	var maxheight = 0

	// optinally start the models at a y position above `position_above_model` if that 
	// model is defined
	var shift_y = (typeof position_above_model != 'undefined' ) ? true : false
	if ( shift_y ) {
		var other_model_extents = makerjs.measure.modelExtents(position_above_model)
		ypos = other_model_extents.high[1] + grid_spacing_between_models
	}


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