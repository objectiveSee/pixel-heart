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

var boxes = Boxes.makeBoxModelsAlongModel(expanded_model, 1.4,10)

// move boxes above the heart in final SVG
// ASSUME: y position of the heart is 0

makerjs.model.move(boxes, [0,heart_extents.height+0.1])
console.log('moving model to '+heart_extents.height+0.1)

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
		outer: notcher.notchModel(expanded_model),
		boxes: boxes
	}
}

// final_model = expanded_model

var svg = makerjs.exporter.toSVG(final_model,export_options);
// console.log(svg)

fs.writeFile("out.svg", svg, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");

});