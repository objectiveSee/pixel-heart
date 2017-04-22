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

// Create expanded model & notch it
var expanded_model = notcher.strokeModel(heart, inner_stroke_around_heart)
var notched_heart = notcher.notchModel(expanded_model, wood_thickness, [-1], notch_width)

// Create 2nd expanded model & notch it
var expanded_model2 = notcher.strokeModel(heart, outer_stroke_around_heart)
var notched_heart2 = notcher.notchModel(expanded_model2, wood_thickness, [-1], notch_width)


// Create boxes & notch
var boxDepth = 18
var boxes = Boxes.makeBoxWallsAlongModelPerimeter(expanded_model2, boxDepth, wood_thickness)

var notch_pattern = [1,1,-1,-1] // starts at 0,0 and goes counter clockwise
var notched_boxes = notcher.notchModelsInParent(boxes, wood_thickness, notch_pattern, notch_width)
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
	strokeWidth: 0.4,
	units: 'mm',
	stroke: 'red',
	useSvgPathOnly: true
}

var final_model = {
	models: {
		heart: heart,
		notched_heart: notched_heart,
		notched_boxes: notched_boxes,
		notched_heart2: notched_heart2
	}
}

var svg = makerjs.exporter.toSVG(final_model,export_options);

fs.writeFile("out.svg", svg, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");

});