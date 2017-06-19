var makerjs 			= require('makerjs')
var LayoutGrid			= require('./layout-grid.js')
var fs 					= require('fs')

var lengths = [69,69,90,24.941,17.456,90,68.615,24.941,220.163,68.615,22,202.697,220.163]

var HEIGHT = 30

var ypos = 0
var yspacing = 2

var final = {
	models: {}
}

var i = 0

lengths.forEach(function(width) {

	var rect = new makerjs.models.Rectangle(width, HEIGHT)

	var top = { 
		type: 'line', 
		origin: [0, 2], 
		end: [width, 2] 
	}
	var middle_1 = { 
		type: 'line', 
		origin: [0, 14], 
		end: [width, 14] 
	}
	var middle_2 = { 
		type: 'line', 
		origin: [0, 18], 
		end: [width, 18] 
	}
	// var middle_1 = { 
	// 	type: 'line', 
	// 	origin: [0, 30], 
	// 	end: [width, 30] 
	// }
	rect.paths.top = top
	rect.paths.middle_1 = middle_1
	rect.paths.middle_2 = middle_2
	top.layer = 'blue'
	middle_1.layer = 'blue'
	middle_2.layer = 'blue'


	//  = {
	// 	top: top,
	// 	middle_1: middle_1,
	// 	middle_2: middle_2
	// }

	final.models['model'+i] = rect
	i++

})

var box_layout_spacing = 2
var DEFAULT_GRID_SPACING_OPTIONS = {
	x_spacing: box_layout_spacing,
	y_spacing: box_layout_spacing,
	max_width: 400,
	grid_spacing_between_models: 2
}
LayoutGrid(final, DEFAULT_GRID_SPACING_OPTIONS)

////////////
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

console.log('Converting to SVG...')
var svg = makerjs.exporter.toSVG(final,export_options)
console.log('SVG conversion finished')

var filename = 'led-mounts.svg'
var output = svg
console.log('Saving...')
fs.writeFile(filename, output, function(err) {
    if(err) {
        return console.log('Error saving: '+err)
    }
    console.log('The file '+filename+' was saved!')
})

