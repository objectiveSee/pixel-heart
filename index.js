var fs 					= require('fs')
var _ 					= require('underscore')
var makerjs 			= require('makerjs')
var Heart 				= require('./heart.js')
var notcher 			= require('./notcher.js')
var Boxes				= require('./box.js')
var LayoutGrid			= require('./layout-grid.js')
var StrokeModel 		= require('./stroke-model.js')
var JoineryExport		= require('./JoineryExport.js')
var FlattenModel 		= require('./flatten-model.js')

/** 
 * Properties of design
 */
var inner_heart_width = 299					// in mm
var wood_thickness = 3.22 					// in mm
var inner_stroke_around_heart = 3.22		// in mm
var outer_stroke_around_heart = 26		// in mm
var grid_spacing_between_models = 13		// for laying out the final boxes and models
var box_depth = 26 							// the height of the final product in mm

/**
 * derived values
 */
var wrap_boxes_after_width = inner_heart_width + inner_stroke_around_heart*2
var box_layout_spacing = wood_thickness*2
var notch_width = wood_thickness


// notching options
var heart_notch_options = {
	thickness: wood_thickness,
	pattern: [-1],
	notch_width: notch_width
}

// Configure boxes that are the vertical walls of the final product
var box_notch_options = {
	thickness: wood_thickness,
	pattern: [1,1,-1,-1],	// bottom is always male, top always female, sides are one of each
	notch_width: notch_width,
	is_walls: true
}

// Spacing options for positioning models
var gridLayoutOptions = {
	x_spacing: box_layout_spacing,
	y_spacing: box_layout_spacing,
	max_width: wrap_boxes_after_width,
	grid_spacing_between_models: grid_spacing_between_models
}


/**
 * Begin building models
 */

// Create the heart model & scale to desired size
var heart = Heart(inner_heart_width)


/**
 * Outer Model & Boxes
 */
// Create outer expanded model & notch it
heart_notch_options.return_notches_without_model = false
var outer_model = StrokeModel(heart, outer_stroke_around_heart)
var notched_heart_outer = notcher.notchModel(outer_model, heart_notch_options)

// Create outer boxes
var boxes_outer = Boxes.makeBoxWallsAlongModelPerimeter(outer_model, box_depth, wood_thickness)
var notched_boxes_outer = notcher.notchModelsInParent(boxes_outer, box_notch_options)
// Align boxes in a grid and position above other model
LayoutGrid(notched_boxes_outer, gridLayoutOptions, outer_model)


/**
 TODO: add text to each box.
var addTextToBoxes = function(boxes) {

	var root_object = boxes.models

	console.log('xxx'+JSON.stringify(root_object,null,'\t'))

	Object.keys(root_object).forEach(function(box_key) {
		var box = root_object[box_key]
		if ( !box.part_id ) {
			console.log('box has no part_id')
		} else {
			console.log('box part_id '+box.part_id)

		}
	})
}
addTextToBoxes(notched_boxes_outer)
*/



// /**
//  * Inner Model & Boxes
//  */
// // Create inner expanded model & notch it
// heart_notch_options.return_notches_without_model = true
// var inner_model = StrokeModel(heart, inner_stroke_around_heart)
// // var notched_heart_inner = notcher.notchModel(inner_model, heart_notch_options)

// // Create inner boxes
// var boxes_inner = Boxes.makeBoxWallsAlongModelPerimeter(inner_model, box_depth, wood_thickness)
// // var notched_boxes_inner = notcher.notchModelsInParent(boxes_inner, box_notch_options)
// // Align boxes in a grid
// LayoutGrid(boxes_inner, gridLayoutOptions, boxes_outer)





// Assemble the final model that will be output
var all_models_combined = {
	models: {
		// boxes_outer:boxes_outer,
		notched_heart_outer:notched_heart_outer,

		// boxes_inner: boxes_inner,
		// inner_model: inner_model,

		// heart: heart
		notched_boxes_outer: notched_boxes_outer,
		// notched_boxes_inner: notched_boxes_inner,
	}
}

// Export final model
var export_options = {
	strokeWidth: 3,
	units: 'mm',
	stroke: 'red',
	useSvgPathOnly: true
}

// var joinery_svg = JoineryExport(all_models_combined)
var svg = makerjs.exporter.toSVG(all_models_combined,export_options)

var filename = 'out.svg'
var output = svg
fs.writeFile(filename, output, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log('The file '+filename+' was saved!')
})

