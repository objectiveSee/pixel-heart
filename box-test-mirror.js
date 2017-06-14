var fs 					= require('fs')
var _ 					= require('underscore')
var makerjs 			= require('makerjs')
var notcher 			= require('./notcher.js')
var Boxes				= require('./box.js')
var LayoutGrid			= require('./layout-grid.js')
var StrokeModel 		= require('./stroke-model.js')
var JoineryExport		= require('./JoineryExport.js')
var FlattenModel 		= require('./flatten-model.js')
var TextLabels 			= require('./text-labels.js')

var SimpleMirror 		= require('./simple-mirror.js')

/** 
 * Properties of design
 */
var inner_width = 152
var stroke_around_inner_model = 26

var wood_thickness = 3.00 					// in mm
var grid_spacing_between_models = 5			// for laying out the final boxes and models
var box_depth = 18 							// the height of the final product in mm
var box_layout_spacing = 2

/**
 * derived values
 */
var wrap_boxes_after_width = inner_width + wood_thickness*2
var notch_width = wood_thickness


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


var inner_model = SimpleMirror(inner_width)

var outer_model = StrokeModel(inner_model, stroke_around_inner_model)


// Outer model
var notched_outer_model = notcher.notchModel(outer_model, {
	thickness: wood_thickness,
	pattern: [-1],
	notch_width: notch_width,
	return_notches_without_model: false
})

var notched_inner_model = notcher.notchModel(inner_model, {
	thickness: wood_thickness,
	pattern: [-1],
	notch_width: notch_width,
	return_notches_without_model: true
})




// Outer Boxes
var boxes_outer = Boxes.makeBoxWallsAlongModelPerimeter(outer_model, box_depth, wood_thickness)
var notched_boxes_outer = notcher.notchModelsInParent(boxes_outer, {
	thickness: wood_thickness,
	pattern: [1,1,1,-1],	// bottom is always male, top always female, sides are one of each
	notch_width: notch_width,
})

// Inner Boxes
var boxes_inner = Boxes.makeBoxWallsAlongModelPerimeter(inner_model, box_depth, wood_thickness)
var notched_boxes_inner = notcher.notchModelsInParent(boxes_inner, {
	thickness: wood_thickness,
	pattern: [1,1,1,-1],	// bottom is always male, top always female, sides are one of each
	notch_width: notch_width,
})

// Inner model etch
var inner_model_etched = StrokeModel(inner_model, -wood_thickness)

LayoutGrid(notched_boxes_outer, gridLayoutOptions, notched_outer_model)
// LayoutGrid(notched_inner_model, gridLayoutOptions, notched_boxes_outer)
LayoutGrid(notched_boxes_inner, gridLayoutOptions, notched_boxes_outer)



inner_model.layer = 'blue'
inner_model_etched.layer = 'blue'

// Assemble the final model that will be output
var all_models_combined = {
	models: {
		notched_outer_model:notched_outer_model,
		notched_boxes_outer:notched_boxes_outer,
		notched_inner_model:notched_inner_model,
		notched_boxes_inner:notched_boxes_inner,
		inner_model:inner_model,
		inner_model_etched:inner_model_etched
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

