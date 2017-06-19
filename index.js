var fs 					= require('fs')
var _ 					= require('underscore')
var makerjs 			= require('makerjs')
var Heart 				= require('./heart.js')
var notcher 			= require('./notcher.js')
var Boxes				= require('./box.js')
var LayoutGrid			= require('./layout-grid.js')
var StrokeModel 		= require('./stroke-model.js')
var JoineryExport		= require('./JoineryExport.js')
var FlattenModel 		= require('./flatten-model.js')
var TextLabels 			= require('./text-labels.js')
var MarioBricks 		= require('./mario-bricks.js')

/** 
 * Properties of design
 * 26mm ~== 1.02 inch
 * all distance units are in mm
 */


var inner_heart_width = 299					// in mm (299mm == 11.7in)
var wood_thickness = 2.82 					// in mm


// distance from inner wall to outer wall in mm
var outer_stroke_around_heart = 26*1.1	
var grid_spacing_between_models = 5		// for laying out the final boxes and models
var box_depth = 26 							// the height of the final product in mm
var box_layout_spacing = 2

/**
 * derived values
 */
var wrap_boxes_after_width = inner_heart_width + wood_thickness*2
var notch_width = wood_thickness

// bottom is always male, top always female, sides are one of each
var STANDARD_BOX_NOTCH_PATTERN = [1,1,1,-1]


var box_notch_options = {
	thickness: wood_thickness,
	pattern: STANDARD_BOX_NOTCH_PATTERN,
	notch_width: notch_width,
}

// Spacing options for positioning models
var DEFAULT_GRID_SPACING_OPTIONS = {
	x_spacing: box_layout_spacing,
	y_spacing: box_layout_spacing,
	max_width: wrap_boxes_after_width,
	grid_spacing_between_models: grid_spacing_between_models
}


/**
 * Begin building models
 */

/**
 * Outer Model & Boxes
 */

// Create the heart model & scale to desired size
// Create outer expanded model & notch it
var heart = Heart(inner_heart_width)

var DIMPLE_OUTER_MODEL = false
var outer_model_heart_type = DIMPLE_OUTER_MODEL ? '13x7-notop-dimple' : '13x7'

var outer_model = StrokeModel(Heart(inner_heart_width, outer_model_heart_type), outer_stroke_around_heart)

var notched_heart_outer = notcher.notchModel(outer_model, {
	thickness: wood_thickness,
	pattern: [-1],
	notch_width: notch_width,
	return_notches_without_model: false
})


var boxes_outer = Boxes.makeBoxWallsAlongModelPerimeter(outer_model, box_depth, wood_thickness)
var notched_boxes_outer = notcher.notchModelsInParent(boxes_outer, {
	thickness: wood_thickness,
	pattern: STANDARD_BOX_NOTCH_PATTERN,
	notch_width: notch_width,
	return_notches_without_model: false
})

// Create a blue line model for where the inside of the outer wall would be aligned
var outer_model_inner_stroke = StrokeModel(outer_model, 0 - wood_thickness)



// /**
//  * Inner Model & Boxes
//  */
// // Create inner expanded model & notch it
var inner_stroke_around_heart = wood_thickness
var inner_model = StrokeModel(heart, inner_stroke_around_heart)
var notched_heart_inner = notcher.notchModel(inner_model, {
	thickness: wood_thickness,
	pattern: [-1],
	notch_width: notch_width,
	return_notches_without_model: true,
})


// Create inner boxes & align
var boxes_inner = Boxes.makeBoxWallsAlongModelPerimeter(inner_model, box_depth, wood_thickness)
var notched_boxes_inner = notcher.notchModelsInParent(boxes_inner, {
	thickness: wood_thickness,
	pattern: STANDARD_BOX_NOTCH_PATTERN,
	notch_width: notch_width,
	return_notches_without_model: false
})


// Align models
// TODO: re-enable boxes (wasn't working)
// LayoutGrid(notched_boxes_outer, DEFAULT_GRID_SPACING_OPTIONS, notched_boxes_inner)

var options = JSON.parse(JSON.stringify(DEFAULT_GRID_SPACING_OPTIONS))
options.x_spacing = 18
options.y_spacing = 8
LayoutGrid(notched_boxes_outer, options, outer_model)
LayoutGrid(notched_boxes_inner, DEFAULT_GRID_SPACING_OPTIONS, notched_boxes_outer)


/**
 * Add text labels on the "blue" layer to some models.
 */
var notched_boxes_inner_text = TextLabels.buildTextForModels(notched_boxes_inner)

var makeLayersBlue = function(layers) {
	layers.forEach(function(l) { l.layer = 'blue' })
}
makeLayersBlue([
	notched_boxes_inner_text,
	heart,
	inner_model,
	outer_model,
	outer_model_inner_stroke]
)

// var all_models_combined = {
// 	models : {
// 		bricks: addBricksToBoxes(notched_boxes_outer),
// 		notched_boxes_outer: notched_boxes_outer
// 	}
// }

// Assemble the final model that will be output
var all_models_combined = {
	models: {
		// boxes_outer:boxes_outer,
		// notched_heart_outer_reversed: notched_heart_outer_reversed
		// text_models_outer_boxes: text_models_outer_boxes,

		//
		// Notched hearts
		// 
		notched_heart_outer: notched_heart_outer,
		notched_heart_inner: notched_heart_inner,

		//
		// Boxes
		//
		notched_boxes_outer: notched_boxes_outer,
		notched_boxes_inner: notched_boxes_inner,
		bricks: MarioBricks(notched_boxes_outer),



		//
		// Misc
		//
		inner_model: inner_model,
		heart: heart,
		outer_model_inner_stroke: outer_model_inner_stroke

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
        return console.log('Error saving: '+err)
    }
    console.log('The file '+filename+' was saved!')
})
