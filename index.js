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

var NUM_JOINTS = 1

// Create expanded model
var expanded_model = makerjs.model.outline(heart, stroke_around_heart, NUM_JOINTS)
//call originate before calling simplify:
makerjs.model.originate(expanded_model);
makerjs.model.simplify(expanded_model);	// simplify paths that should be a single path after outline()

expanded_model = expanded_model.models['0']	// grab the model, not this wrapper around it


// Name layers
heart.layer = 'inner'
expanded_model.layer = 'outer'
// console.log('model is '+JSON.stringify(expanded_model.models,null,'\t'));


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
		// outer: notcher.notchModel(expanded_model)
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