var makerjs 			= require('makerjs')

var path = [1,-1,-1,1]
var origin = [0,1]


/**
 * Builds an array of points that define a model by generating points 
 * from the `path` defined above.
 */
function PixelWalker(firstPoint, pixel_path) {

	// go clockwise starting first point
	var points = []
	points.push(firstPoint)

	var moveHorizontal = true	// alternate horizontal and vertical movements

	pixel_path.forEach(function(p) {

		var previous_point = points[points.length-1]
		var point_to_add;

		if ( moveHorizontal ) {
			point_to_add = [p,0]					
		} else {
			point_to_add = [0,p]
		}
		var e = makerjs.point.add(previous_point, point_to_add)
		points.push(e)	
		
		// flip direction each time
		moveHorizontal = !moveHorizontal
	})

	return points
}

function Whatever(desired_width, version) {

	var points = PixelWalker(origin, path)
	var pathModel = new makerjs.models.ConnectTheDots(true, points)
	if ( typeof desired_width != 'undefined' ) {
	  	var scale = desired_width
		makerjs.model.scale(pathModel, scale)
	}
	return pathModel
}

/**
 * Define input properties for when this module is used within the maker.js playground.
 * See http://microsoft.github.io/maker.js/playground
 */
Whatever.metaParameters = [
    { title: "Width", type: "range", min: 1, max: 130, value: 30 }
]

module.exports = Whatever
