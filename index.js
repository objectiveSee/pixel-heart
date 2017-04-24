// var heart = require('./heart.js');

var fs 					= require('fs')
var _ 					= require('underscore')
var makerjs 			= require('makerjs')
var Heart 				= require('./heart.js')
var notcher 			= require('./notcher.js')
var Boxes				= require('./box.js')
var LayoutGrid			= require('./layout-grid.js')

/** 
 * Properties of design
 */
var inner_heart_width = 305
var wood_thickness = 3.22 // in mm
var inner_stroke_around_heart = wood_thickness * 2
var outer_stroke_around_heart = 25.4
var grid_spacing_between_models = 15

// derived values
var wrap_boxes_after_width = inner_heart_width + inner_stroke_around_heart*2
var box_layout_spacing = wood_thickness/2
var notch_width = wood_thickness


// Create the heart model & scale to desired size
var heart = Heart(inner_heart_width)

// Create expanded model & notch it with boxes only
var heart_notch_options = {
	thickness: wood_thickness,
	pattern: [-1],
	notch_width: notch_width
}

// Create 2nd expanded model & notch it
heart_notch_options.notches_are_boxes = false
var outer_model = notcher.strokeModel(heart, outer_stroke_around_heart)
var notched_heart_outer = notcher.notchModel(outer_model, heart_notch_options)

// Create 1st expanded model & notch it
heart_notch_options.notches_are_boxes = true
var inner_model = notcher.strokeModel(heart, inner_stroke_around_heart)
var notched_heart_inner = notcher.notchModel(inner_model, heart_notch_options)


// Create boxes & notch
var boxDepth = 18
var box_notch_options = {
	thickness: wood_thickness,
	pattern: [1,1,-1,-1],	// bottom is always male, top always female, sides are one of each
	notch_width: notch_width,
	is_walls: true
}

// Outer boxes
var boxes_outer = Boxes.makeBoxWallsAlongModelPerimeter(outer_model, boxDepth, wood_thickness)

var notched_boxes_outer = notcher.notchModelsInParent(boxes_outer, box_notch_options)
LayoutGrid(notched_boxes_outer, {
	x_spacing: box_layout_spacing,
	y_spacing: box_layout_spacing,
	max_width: wrap_boxes_after_width
})	// re-align in a grid
// move boxes above the heart in final SVG
// ASSUME: y position of the heart is 0
var heart_extents = makerjs.measure.modelExtents(outer_model)
makerjs.model.move(notched_boxes_outer, [0,heart_extents.high[1]+grid_spacing_between_models])


// Inner boxes
var boxes_inner = Boxes.makeBoxWallsAlongModelPerimeter(inner_model, boxDepth, wood_thickness)
var notched_boxes_inner = notcher.notchModelsInParent(boxes_inner, box_notch_options)
LayoutGrid(notched_boxes_inner, {
	x_spacing: box_layout_spacing,
	y_spacing: box_layout_spacing,
	max_width: wrap_boxes_after_width
})	// re-align in a grid

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
inner_model.layer = 'inner_model'
notched_boxes_outer.layer = 'notched_boxes_outer'
notched_boxes_inner.layer = 'notched_boxes_inner'

var final_model = {
	models: {
		//heart: heart,
		notched_heart_inner: notched_heart_inner,
		notched_heart_outer: notched_heart_outer,
		inner_model: inner_model,
		notched_boxes_outer: notched_boxes_outer,
		notched_boxes_inner: notched_boxes_inner
	}
}

var svg = makerjs.exporter.toSVG(final_model,export_options);

var file = "<!DOCTYPE html>\n"+
"<html>\n"+
"<body>\n\n"+
svg+
"\n\n</body>\n"+
"</html>\n"

var output_as_svg = true
var filename, output

if ( output_as_svg ) {
	filename = 'out.svg'
	output = svg
} else {
	filename = 'out.html'
	output = file
}

fs.writeFile(filename, output, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log('The file '+filename+' was saved!');

});