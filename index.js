// var heart = require('./heart.js');

var fs 					= require('fs')
var _ 					= require('underscore')
var makerjs 			= require('makerjs')
var Heart 				= require('./heart.js')
var notcher 			= require('./notcher.js')
var Boxes				= require('./box.js')
var LayoutGrid			= require('./layout-grid.js')

var stroke_around_heart = 0.322
var wood_thickness = 0.1
var wrap_boxes_after_width = 10

// Create the heart model
var heart = Heart()

// Create expanded model & notch it
var expanded_model = notcher.strokeModel(heart, stroke_around_heart)
var notched_heart = notcher.notchModel(expanded_model, wood_thickness)


// Create boxes & notch
var boxes = Boxes.makeBoxWallsAlongModelPerimeter(expanded_model, 1.4,10)

var notch_pattern = [1,1,-1,-1] // starts at 0,0 and goes counter clockwise
var notched_boxes = notcher.notchModelsInParent(boxes, wood_thickness, notch_pattern)
LayoutGrid(notched_boxes, wrap_boxes_after_width)	// re-align in a grid


// move boxes above the heart in final SVG
// ASSUME: y position of the heart is 0
var heart_extents = makerjs.measure.modelExtents(expanded_model)
makerjs.model.move(notched_boxes, [0,heart_extents.height+0.1])


// Name layers
heart.layer = 'inner'
expanded_model.layer = 'outer'
boxes.layer = 'boxes'


// Export final model
var export_options = {
	strokeWidth: 0.01,
	units: 'mm',
	stroke: 'red',
	useSvgPathOnly: true
}

var final_model = {
	models: {
		inner: heart,
		outer: notched_heart,
		boxes: notched_boxes
	}
}

var svg = makerjs.exporter.toSVG(final_model,export_options);

fs.writeFile("out.svg", svg, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");

});