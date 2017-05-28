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
var TextLabels 			= require('./text-labels.js')

/** 
 * Properties of design
 */
var inner_heart_width = 156					// in mm
var wood_thickness = 2.82 					// in mm
var outer_stroke_around_heart = 12			// in mm
var grid_spacing_between_models = 5		// for laying out the final boxes and models
var box_depth = 18 							// the height of the final product in mm
var box_layout_spacing = 2

/**
 * derived values
 */
var wrap_boxes_after_width = inner_heart_width + wood_thickness*2
var notch_width = wood_thickness


// // Configure boxes that are the vertical walls of the final product
// var box_notch_options = {
// 	thickness: wood_thickness,
// 	pattern: [1,1,-1,-1],	// bottom is always male, top always female, sides are one of each
// 	notch_width: notch_width,
// }

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
var heart_no_dimple = Heart(inner_heart_width, '7x6-notop-dimple')
var heart = Heart(inner_heart_width, '7x6')

/**
 * Outer Model & Boxes
 */


// Create model
var outer_model = StrokeModel(heart_no_dimple, outer_stroke_around_heart)


// Notch model
var notched_heart_outer = notcher.notchModel(outer_model, {
	thickness: wood_thickness,
	pattern: [-1],
	notch_width: notch_width,
	return_notches_without_model: false
})


// Boxes
var boxes_outer = Boxes.makeBoxWallsAlongModelPerimeter(outer_model, box_depth, wood_thickness)
var notched_boxes_outer = notcher.notchModelsInParent(boxes_outer, {
	thickness: wood_thickness,
	pattern: [1,1,1,-1],	// bottom is always male, top always female, sides are one of each
	notch_width: notch_width,
})


// Top piece
var top_model = StrokeModel(heart_no_dimple, outer_stroke_around_heart)
var notched_heart_top = notcher.notchModel(top_model, {
	thickness: wood_thickness,
	pattern: [-1],
	notch_width: notch_width,
	return_notches_without_model: false
})

LayoutGrid({models:{'1':notched_heart_top}}, gridLayoutOptions, notched_heart_outer)
LayoutGrid(notched_boxes_outer, gridLayoutOptions, notched_heart_top)


// Assemble the final model that will be output
var all_models_combined = {
	models: {
		notched_heart_outer: notched_heart_outer,
		heart: heart,
		notched_boxes_outer: notched_boxes_outer,
		notched_heart_top: notched_heart_top,
	}
}



// Export final model
var export_options = {
	strokeWidth: 1,
	stroke: 'red',
	units: 'mm',
	useSvgPathOnly: true,
	layerOptions: {
		'blue' : {
			stroke: 'blue'
		},
		'red' : {
			stroke: 'red'
		}
	}
}

// var joinery_svg = JoineryExport(all_models_combined)
console.log('Converting to SVG...')
var svg = makerjs.exporter.toSVG(all_models_combined,export_options)
console.log('SVG conversion finished')

var filename = 'out.svg'
var output = svg
console.log('Saving...')
fs.writeFile(filename, output, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log('The file '+filename+' was saved!')
})

