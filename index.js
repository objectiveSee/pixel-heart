var _ = require('underscore')
var Point = require('point-geometry')
var fs = require('fs')

var PIXELS_WIDE = 13
var PIXELS_TALL = 11
var SCALING_DOWN_FACTOR = 11/13

var options = {
	total_width: 330,
	thickness: 3.2
}


/// Important Calculations
var total_width = options.total_width
var thickness = options.thickness ? options.thickness : 0

var pixel_size = total_width / PIXELS_WIDE
var thickness_normalized = thickness / pixel_size

// go clockwise starting from leftmost point (x=0,y=2 in pixels)
var NOTCH_SIZE_RELATIVE = thickness_normalized

console.log('Heart dimensions is '+options.total_width.toFixed(1)+'mm x '+(options.total_width*SCALING_DOWN_FACTOR).toFixed(1)+'mm')
console.log('Pixel dimensions is '+pixel_size.toFixed(1)+'mm x '+pixel_size.toFixed(1)+'mm')
console.log('NOTCH_SIZE_RELATIVE is '+NOTCH_SIZE_RELATIVE.toFixed(1))


// Path array
// first modification is to the right
var path = [1,-1,1,-1,3,1,3,-1,3,1,1,1,1,3,-1,1,-1,1,-1,1,-1,1,-1,1,-1,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-3]	

var makeCoordinatesForBoxes = function() {

	var boxes = []
	var xOffset = NOTCH_SIZE_RELATIVE	// ensure shape does not have negative x coord with 1st notch
	var yOffset = 13+NOTCH_SIZE_RELATIVE*3	// start below the heart with some padding

	_.each(path, function(p) {

		var py = 1
		var px = Math.abs(p)
		var points = [];

		{
			var a = new Point(0,0)
			var b = a.add(new Point(0.25*px,0))
			var c = b.add(new Point(0,-NOTCH_SIZE_RELATIVE))  // outward
			var d = c.add(new Point(0.5*px,0))
			var e = d.add(new Point(0,NOTCH_SIZE_RELATIVE))  // inward
			var f = new Point(px,0)
			points.push(a,b,c,d,e,f)
		}
		{
			var a = new Point(px,0)
			var b = a.add(new Point(0,0.25*py))
			var c = b.add(new Point(-NOTCH_SIZE_RELATIVE,0)) 
			var d = c.add(new Point(0, 0.5*py))
			var e = d.add(new Point(NOTCH_SIZE_RELATIVE,0))
			var f = new Point(px,py)
			points.push(b,c,d,e,f)	// exclude a
		}
		{
			var a = new Point(px,py)
			var b = a.add(new Point(-0.25*px,0))
			var c = b.add(new Point(0,NOTCH_SIZE_RELATIVE))  
			var d = c.add(new Point(-0.5*px,0))
			var e = d.add(new Point(0,-NOTCH_SIZE_RELATIVE))  
			var f = new Point(0,py)
			points.push(b,c,d,e,f)
		}
		{
			var a = new Point(0,py)
			var b = a.add(new Point(0,-0.25*py))
			var c = b.add(new Point(-NOTCH_SIZE_RELATIVE,0)) 
			var d = c.add(new Point(0, -0.5*py))
			var e = d.add(new Point(NOTCH_SIZE_RELATIVE,0))
			var f = new Point(0,0)
			points.push(b,c,d,e,f)	// exclude a
		}


		if ( xOffset + p > PIXELS_WIDE ) {
			xOffset = NOTCH_SIZE_RELATIVE	// reset to left margin
			yOffset = yOffset + (1+2*NOTCH_SIZE_RELATIVE)
		}

		var final_points = _.map(points, function(point) {
			var a = point.mult(pixel_size,pixel_size)
			return a.add(new Point(pixel_size*xOffset,pixel_size*yOffset))
		})

		if ( boxes.length == 0 ) {
			console.log(final_points)
		}

		boxes.push(final_points)

		xOffset += Math.abs(p)

	});

	return boxes

}

/**
 * Generate an array of points that make the heart shape.
 * options specifies size of heart.
 */
var makeCoordinatesForHeart = function() {

	// go clockwise starting from leftmost point (x=0,y=2 in pixels)
	var points = []

	var firstPoint = new Point(0,2)
	points.push(firstPoint)


	var moveHorizontal = true
	var iteration = 0

	_.each(path, function(p) {

		var previous_point = _.last(points)


		// no need to add lines for notch if thickness is zero, just skip and add the final point
		if ( thickness > 0 ) {

			var counter = (p > 0) ? 1 : -1		// is the "turn" around regular or not? 
												// remember: This script moves clockwise around the heart 

			if ( moveHorizontal ) {

				var a = previous_point.add(new Point(.25*p,0))

				// the notch begins
				var b = a.add(new Point(0,NOTCH_SIZE_RELATIVE*counter))
				var c = b.add(new Point(.5*p,0))
				var d = c.add(new Point(0,-NOTCH_SIZE_RELATIVE*counter))

				points.push(a,b,c,d)

			} else {

				counter *= -1

				var a = previous_point.add(new Point(0,.25*p))

				var b = a.add(new Point(NOTCH_SIZE_RELATIVE*counter,0))
				var c = b.add(new Point(0,.5*p))
				var d = c.add(new Point(-NOTCH_SIZE_RELATIVE*counter, 0))

				points.push(a,b,c,d)
			}
		}

		// final line from end of notch to end of section relative from the begind of the side
		// as an attempt to prevent floating point precision issues from compounding on each
		// side of the heart shape.
		if ( moveHorizontal ) {
			var e = previous_point.add(new Point(p,0))
			points.push(e)			
		} else {
			var e = previous_point.add(new Point(0,p))
			points.push(e)
		}
		
		// flip each time
		moveHorizontal = !moveHorizontal;
		iteration++
	});

	return _.map(points, function(point) {
		return point.mult(pixel_size,pixel_size)
	})

}

/**
 * Converts an array of points into an SVG path string.
 */
var convertToSvg = function(path) {

	var string = ''

	var first = true
	_.each(path, function(p) {
		string = string + (first?'M ':' L ')
		first = false
		string = string+p.x+' '+p.y
	})

	return string

}

/*
 * Take a SVG path string and writes to a SVG file.
 */
var makeSVGFile = function(paths, doc_width, doc_height) {

	var template = '<?xml version="1.0" standalone="no"?>\n'+
		'<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n'+
		'<svg viewBox = "0 0 '+doc_width+'mm '+doc_height+'mm" version = "1.1">\n\n'

	var path_index = 0;
	_.each(paths, function(path_string) {
		var svg_path_string = '    <path id = "path'+path_index+'" d = "'+path_string+
			'" fill = "none" stroke = "red" stroke-width = ".01"/>\n'
		template = template + svg_path_string
		path_index++
	})

	template = template + '\n</svg>'

	fs.writeFile("out.svg", template, function(err) {
	    if(err) {
	        return console.log(err);
	    }

	    console.log("The file was saved!");

	}); 
}

var heart = makeCoordinatesForHeart()
var boxes = makeCoordinatesForBoxes()

// console.log(x)
var items = []

var box_items = _.map(boxes, function(box) {
	return convertToSvg(box)
})
items = items.concat(box_items)

var heart_svg = convertToSvg(heart)
items = items.concat(heart_svg)


makeSVGFile(items,options.total_width,options.total_width)


