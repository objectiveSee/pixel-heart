// var heart = require('./heart.js');

var fs 					= require('fs')
var _ 					= require('underscore')
var makerjs 			= require('makerjs')
var Heart 				= require('./heart.js')
var notcher 			= require('./notcher.js')

var stroke_around_heart = 0.322

// Create the heart model
var heart = Heart({
	thickness: 0.0
})

// Create expanded model
var expanded_model = notcher.strokeModel(heart, stroke_around_heart)
// console.log('expanded model: '+JSON.stringify(expanded_model))

// Name layers
heart.layer = 'inner'
expanded_model.layer = 'outer'


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
		outer: notcher.notchModel(expanded_model)
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