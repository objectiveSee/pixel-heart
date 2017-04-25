var fs 					= require('fs')
var _ 					= require('underscore')
var makerjs 			= require('makerjs')
var Heart 				= require('./heart.js')
var notcher 			= require('./notcher.js')
var Boxes				= require('./box.js')
var LayoutGrid			= require('./layout-grid.js')
var StrokeModel 		= require('./stroke-model.js')

/** 
 * Properties of design
 */
var inner_heart_width = 305					// in mm
var wood_thickness = 3.22 					// in mm
var inner_stroke_around_heart = 6.44		// in mm
var outer_stroke_around_heart = 25.4		// in mm
var grid_spacing_between_models = 15		// for laying out the final boxes and models
var box_depth = 18 							// the height of the final product in mm

/**
 * derived values
 */
var wrap_boxes_after_width = inner_heart_width + inner_stroke_around_heart*2
var box_layout_spacing = wood_thickness/2
var notch_width = wood_thickness


// Create the heart model & scale to desired size
var heart = Heart(inner_heart_width)

// notching options
var heart_notch_options = {
	thickness: wood_thickness,
	pattern: [-1],
	notch_width: notch_width
}

// Create outer expanded model & notch it
heart_notch_options.return_notches_without_model = false
var outer_model = StrokeModel(heart, outer_stroke_around_heart)
var notched_heart_outer = notcher.notchModel(outer_model, heart_notch_options)

// Create inner expanded model & notch it
heart_notch_options.return_notches_without_model = true
var inner_model = StrokeModel(heart, inner_stroke_around_heart)
var notched_heart_inner = notcher.notchModel(inner_model, heart_notch_options)


// Configure boxes that are the vertical walls of the final product
var box_notch_options = {
	thickness: wood_thickness,
	pattern: [1,1,-1,-1],	// bottom is always male, top always female, sides are one of each
	notch_width: notch_width,
	is_walls: true
}

// Create outer boxes
var boxes_outer = Boxes.makeBoxWallsAlongModelPerimeter(outer_model, box_depth, wood_thickness)
var notched_boxes_outer = notcher.notchModelsInParent(boxes_outer, box_notch_options)

// Align boxes in a grid
LayoutGrid(notched_boxes_outer, {
	x_spacing: box_layout_spacing,
	y_spacing: box_layout_spacing,
	max_width: wrap_boxes_after_width
})

// move boxes above the heart in final SVG
var heart_extents = makerjs.measure.modelExtents(outer_model)
makerjs.model.move(notched_boxes_outer, [0,heart_extents.high[1]+grid_spacing_between_models])


// Create inner boxes
var boxes_inner = Boxes.makeBoxWallsAlongModelPerimeter(inner_model, box_depth, wood_thickness)
var notched_boxes_inner = notcher.notchModelsInParent(boxes_inner, box_notch_options)

// Align boxes in a grid
LayoutGrid(notched_boxes_inner, {
	x_spacing: box_layout_spacing,
	y_spacing: box_layout_spacing,
	max_width: wrap_boxes_after_width
})

// move boxes above the other notched boxes in final SVG
var outer_boxes_extents = makerjs.measure.modelExtents(notched_boxes_outer)
makerjs.model.move(notched_boxes_inner, [0,outer_boxes_extents.high[1]+grid_spacing_between_models])


// Export final model
var export_options = {
	strokeWidth: 3,
	units: 'mm',
	stroke: 'red',
	useSvgPathOnly: true
}

// Name layers
notched_heart_inner.layer = 'notched_heart_inner'
notched_heart_outer.layer = 'notched_heart_outer'
//inner_model.layer = 'inner_model'
notched_boxes_outer.layer = 'notched_boxes_outer'
notched_boxes_inner.layer = 'notched_boxes_inner'

var final_model = {
	models: {
		//heart: heart,
		notched_heart_inner: notched_heart_inner,
		notched_heart_outer: notched_heart_outer,
//		inner_model: inner_model,
		notched_boxes_outer: notched_boxes_outer,
		notched_boxes_inner: notched_boxes_inner
	}
}

var svg = makerjs.exporter.toSVG(final_model,export_options);

var output_as_svg = true
var filename, output

// Option to export as SVG or HTML file
if ( output_as_svg ) {
	filename = 'out.svg'
	output = svg
} else {
	var file = "<!DOCTYPE html>\n"+
		"<html>\n"+
		"<body>\n\n"+
		svg+
		"\n\n</body>\n"+
		"</html>\n"
	filename = 'out.html'
	output = file
}


fs.writeFile(filename, output, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log('The file '+filename+' was saved!')
})

