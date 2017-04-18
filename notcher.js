var _ 					= require('underscore')
var Point 				= require('point-geometry')
var makerjs 			= require('makerjs')

function notchModel(model, thickness) {

	var points = [];

	var thickness = thickness ? thickness : 0.1

	var first_time = true
	var i = 0

	// console.log(model)
	// console.log(model.paths)

	var isEven = true

	console.log(JSON.stringify(model,null,'\t'))

	_.each(Object.keys(model.paths), function(path_name) {


		var path = model.paths[path_name]
		var end = path.end


		if ( first_time ) {
			first_time = false
			// push first point
			points.push(path.origin)
		}

		points.push(end)

		// var angle = makerjs.angle.ofLineInDegrees(path)
		// console.log('path '+i+' ('+path.origin[0]+' '+path.origin[1]+') to ('
			// +path.end[0]+' '+path.end[1]+')')

		// var isHorizontal = ( makerjs.measure.isAngleEqual(angle,0) || 
		// 					makerjs.measure.isAngleEqual(angle,180) ) 
		// 					? true : false;
		// if ( isHorizontal && !isEven ) {
		// 	throw new Error('bad swap')
		// }

		// // var m = makerjs.measure.pathExtents(path)
		// // var totalWidth = m.high[0] - m.low[0]
		// // var totalHeight = m.high[1] - m.low[1]
		// // var length = isHorizontal ? totalWidth : totalHeight
		var length = makerjs.measure.pathLength(path)
		console.log('len: '+length)

		// // find start of notch
		// var difference_point = makerjs.point.subtract(path.end, path.origin)
		// // console.log(difference_point)
		// var mod_a = makerjs.point.scale(difference_point, 0.4)
		// var mod_b = makerjs.point.scale(difference_point, 0.6)

		// var a = makerjs.point.add(path.origin, mod_a)
		// var b = makerjs.point.add(path.origin, mod_b)

		// var notch_point = isHorizontal ? [0,thickness] : [thickness,0]
		// var aa = makerjs.point.add(a, notch_point)
		// var bb = makerjs.point.add(b, notch_point)

		// var line = new makerjs.paths.Line(aa, bb)
		// // make test line because there is no `isPointInsideModel` function
		// // modify aa/bb if we want to go outside not inside or vice versus
		// if ( ! makerjs.model.isPathInsideModel(line, model) ) {
		// 	notch_point = isHorizontal ? [0,-thickness] : [-thickness,0]
		// 	aa = makerjs.point.add(a, notch_point)
		// 	bb = makerjs.point.add(b, notch_point)
		// }

		// // points.push(a,b)
		// // points.push(a)
		// if ( i == 5 ) {
		// 	console.log('notch of interest')
		// 	// console.log('origin',path.origin)
		// 	// console.log('end',path.end, 'length',length)
		// 	console.log(path.origin,a,aa,bb,b,end)
		// }

		// points.push(end)
		i++
		// isEven = !isEven



	});

	return new makerjs.models.ConnectTheDots(true, points)
} 

module.exports.notchModel = notchModel