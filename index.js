// var heart = require('./heart.js');

var fs 					= require('fs')
var _ 					= require('underscore')
var makerjs 			= require('makerjs')
var Heart 				= require('./heart.js')
var notcher 			= require('./notcher.js')
var Boxes				= require('./box.js')

var stroke_around_heart = 0.322

// Create the heart model
var heart = Heart({
	thickness: 0.0
})

// Create expanded model
var expanded_model = notcher.strokeModel(heart, stroke_around_heart)
// console.log('expanded model: '+JSON.stringify(expanded_model))

var heart_extents = makerjs.measure.modelExtents(expanded_model)

var boxes = Boxes.makeBoxWallsAlongModelPerimeter(expanded_model, 1.4,10)
// var onebox = boxes.models['model38']
var notched_boxes = notcher.notchModelsInParent(boxes)
// console.log(JSON.stringify(notched_boxes,null,' '))
// console.log(onebox)odel.walk() was not synch
// var notched_boxes = {}

// console.log(Object.keys(boxes.models))

// todo start here not adding boxes to SVG

// Object.keys(boxes.models).forEach(function(key) {
// 	var b = boxes[key]
// 	// console.log(b)
// 	notched_boxes[key] = notcher.notchModel(b, 0.322)
// })
// var final_notched_box_model = {
// 	model: notched_boxes
// }

// move boxes above the heart in final SVG
// ASSUME: y position of the heart is 0

// makerjs.model.move(final_notched_box_model, [0,heart_extents.height+0.1])
// console.log('moving model to '+heart_extents.height+0.1)

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
		// inner: heart,
		// outer: notcher.notchModel(expanded_model),
		boxes: notched_boxes
	}
}

console.log(final_model)

// final_model = expanded_model

var svg = makerjs.exporter.toSVG(final_model,export_options);
// console.log(svg)

fs.writeFile("out.svg", svg, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");

});