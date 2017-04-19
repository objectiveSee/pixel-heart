var makerjs 			= require('makerjs')

/**
	 _______ _________          _______  _       
	(  ____ )\__   __/|\     /|(  ____ \( \      
	| (    )|   ) (   ( \   / )| (    \/| (      
	| (____)|   | |    \ (_) / | (__    | |      
	|  _____)   | |     ) _ (  |  __)   | |      
	| (         | |    / ( ) \ | (      | |      
	| )      ___) (___( /   \ )| (____/\| (____/\
	|/       \_______/|/     \|(_______/(_______/
	                                             
	          _______  _______  _______ _________
	|\     /|(  ____ \(  ___  )(  ____ )\__   __/
	| )   ( || (    \/| (   ) || (    )|   ) (   
	| (___) || (__    | (___) || (____)|   | |   
	|  ___  ||  __)   |  ___  ||     __)   | |   
	| (   ) || (      | (   ) || (\ (      | |   
	| )   ( || (____/\| )   ( || ) \ \__   | |   
	|/     \|(_______/|/     \||/   \__/   )_(   
                                           
*/

// "path" is an array of movements needed to make the heart. It alternates vertical and horizontal
// movements. Each movement is the amount specified in the array, for example `-3` would be moving
// 3 units in the negative direction.
var path = [1,1,1,1,3,-1,3,1,3,-1,1,-1,1,-3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,-1,1,-1,1,-1,1,-1,1,-1,1,-1,3]	

function Heart() {

	// go clockwise starting from leftmost point
	var points = []
	var firstPoint = [0,9]
	points.push(firstPoint)

	var moveHorizontal = true	// alternate horizontal and vertical movements to form pixel heart

	path.forEach(function(p) {

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


	var pathModel = new makerjs.models.ConnectTheDots(true, points)

	return pathModel

}

module.exports = Heart
