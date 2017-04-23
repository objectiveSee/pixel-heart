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
var outer_stroke_around_heart = 30

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
var expanded_model2 = notcher.strokeModel(heart, outer_stroke_around_heart)
var notched_heart_outer = notcher.notchModel(expanded_model2, heart_notch_options)

// Create 1st expanded model & notch it
heart_notch_options.notches_are_boxes = true
var expanded_model = notcher.strokeModel(heart, inner_stroke_around_heart)
var notched_heart_inner = notcher.notchModel(expanded_model, heart_notch_options)


// Create boxes & notch
var boxDepth = 18
var boxes = Boxes.makeBoxWallsAlongModelPerimeter(expanded_model2, boxDepth, wood_thickness)

var notch_pattern = [1,1,-1,-1] // starts at 0,0 and goes counter clockwise
var notched_boxes = notcher.notchModelsInParent(boxes, {
	thickness: wood_thickness,
	pattern: notch_pattern,
	notch_width: notch_width,
	is_walls: true
})
LayoutGrid(notched_boxes, {
	x_spacing: box_layout_spacing,
	y_spacing: box_layout_spacing,
	max_width: wrap_boxes_after_width
})	// re-align in a grid


// move boxes above the heart in final SVG
// ASSUME: y position of the heart is 0
var heart_extents = makerjs.measure.modelExtents(expanded_model2)
makerjs.model.move(notched_boxes, [0,heart_extents.height+0.1])


// Name layers
heart.layer = 'inner'
expanded_model.layer = 'outer'
notched_boxes.layer = 'boxes'


// Export final model
var export_options = {
	strokeWidth: 3,
	units: 'mm',
	stroke: 'red',
	useSvgPathOnly: true
}

var final_model = {
	models: {
		//heart: heart,
		notched_heart_inner: notched_heart_inner,
		notched_heart_outer: notched_heart_outer,
		inner_heart_blue_path: expanded_model,
		notched_boxes: notched_boxes
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