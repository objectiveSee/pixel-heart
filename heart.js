var makerjs 			= require('makerjs')
var _ 					= require('underscore')

// "path" is an array of movements needed to make the heart. It alternates vertical and horizontal
// movements. Each movement is the amount specified in the array, for example `-3` would be moving
// 3 units in the negative direction.
var path = [1,-1,1,-1,3,1,3,-1,3,1,1,1,1,3,-1,1,-1,1,-1,1,-1,1,-1,1,-1,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-3]	

function Heart(options) {

	// go clockwise starting from leftmost point (x=0,y=2)
	var points = []
	var firstPoint = [0,2]
	points.push(firstPoint)

	var moveHorizontal = true	// alternate horizontal and vertical movements to form pixel heart

	_.each(path, function(p) {

		var previous_point = _.last(points)
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


	var pathModel = new makerjs.models.ConnectTheDots(true, points)
	console.log(pathModel.paths)

	// NOTE: the heart model is oriented wrong because I used top left as 0,0 origin instead
	// of bottom right. rotate to fix it.
	// TODO: rotating will cause slight issues with floating point rounding, so disabling that!
	// return makerjs.model.mirror(pathModel, false, true)	// mirror y, dont mirror x	
	return pathModel

}

// Heart.metaParameters = [
//     { title: "radius", type: "range", min: .01, max: 100, step: 1, value: 10 },
//     { title: "angle", type: "range", min: 60, max: 120, step: 1, value: 90 }
// ]

module.exports = Heart
