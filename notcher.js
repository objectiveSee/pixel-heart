var makerjs 			= require('makerjs')

var pixel_heart = {"paths":{"ShapeLine1":{"type":"line","origin":[0,9],"end":[1,9]},"ShapeLine2":{"type":"line","origin":[1,9],"end":[1,10]},"ShapeLine3":{"type":"line","origin":[1,10],"end":[2,10]},"ShapeLine4":{"type":"line","origin":[2,10],"end":[2,11]},"ShapeLine5":{"type":"line","origin":[2,11],"end":[5,11]},"ShapeLine6":{"type":"line","origin":[5,11],"end":[5,10]},"ShapeLine7":{"type":"line","origin":[5,10],"end":[8,10]},"ShapeLine8":{"type":"line","origin":[8,10],"end":[8,11]},"ShapeLine9":{"type":"line","origin":[8,11],"end":[11,11]},"ShapeLine10":{"type":"line","origin":[11,11],"end":[11,10]},"ShapeLine11":{"type":"line","origin":[11,10],"end":[12,10]},"ShapeLine12":{"type":"line","origin":[12,10],"end":[12,9]},"ShapeLine13":{"type":"line","origin":[12,9],"end":[13,9]},"ShapeLine14":{"type":"line","origin":[13,9],"end":[13,6]},"ShapeLine15":{"type":"line","origin":[13,6],"end":[12,6]},"ShapeLine16":{"type":"line","origin":[12,6],"end":[12,5]},"ShapeLine17":{"type":"line","origin":[12,5],"end":[11,5]},"ShapeLine18":{"type":"line","origin":[11,5],"end":[11,4]},"ShapeLine19":{"type":"line","origin":[11,4],"end":[10,4]},"ShapeLine20":{"type":"line","origin":[10,4],"end":[10,3]},"ShapeLine21":{"type":"line","origin":[10,3],"end":[9,3]},"ShapeLine22":{"type":"line","origin":[9,3],"end":[9,2]},"ShapeLine23":{"type":"line","origin":[9,2],"end":[8,2]},"ShapeLine24":{"type":"line","origin":[8,2],"end":[8,1]},"ShapeLine25":{"type":"line","origin":[8,1],"end":[7,1]},"ShapeLine26":{"type":"line","origin":[7,1],"end":[7,0]},"ShapeLine27":{"type":"line","origin":[7,0],"end":[6,0]},"ShapeLine28":{"type":"line","origin":[6,0],"end":[6,1]},"ShapeLine29":{"type":"line","origin":[6,1],"end":[5,1]},"ShapeLine30":{"type":"line","origin":[5,1],"end":[5,2]},"ShapeLine31":{"type":"line","origin":[5,2],"end":[4,2]},"ShapeLine32":{"type":"line","origin":[4,2],"end":[4,3]},"ShapeLine33":{"type":"line","origin":[4,3],"end":[3,3]},"ShapeLine34":{"type":"line","origin":[3,3],"end":[3,4]},"ShapeLine35":{"type":"line","origin":[3,4],"end":[2,4]},"ShapeLine36":{"type":"line","origin":[2,4],"end":[2,5]},"ShapeLine37":{"type":"line","origin":[2,5],"end":[1,5]},"ShapeLine38":{"type":"line","origin":[1,5],"end":[1,6]},"ShapeLine39":{"type":"line","origin":[1,6],"end":[0,6]},"ShapeLine40":{"type":"line","origin":[0,6],"end":[0,9]}}};

var pointAsString = function(point) {
	return '('+point[0].toFixed(2)+','+point[1].toFixed(2)+')'
}
var pathAsString = function(path) {
	return 'Origin: '+pointAsString(path.origin)+' End:'+pointAsString(path.end)
}

function notchModel(model, thickness) {

	var points = [];

	var thickness = (typeof thickness != 'undefined') ? thickness : 0.1

	var first_time = true
	var i = 0

	// console.log(model)
	// console.log(model.paths)

	var isEven = true

	// console.log(JSON.stringify(model,null,'\t'))

	if ( !model.paths ) {
		throw new Error('missing paths in model:',JSON.stringify(model))
	}

	var keys = Object.keys(model.paths)

	keys.forEach(function(path_name) {


		var path = model.paths[path_name]
		var end = path.end
		var origin = path.origin


		if ( first_time ) {
			first_time = false
			// push first point
			points.push(path.origin)
		}

		var last_point = points[points.length-1]
		
		console.log('-------------------------------')
        console.log(path_name+' '+pathAsString(path))

       	if ( ! makerjs.point.closest(last_point, [origin,end]) ) {
       		console.log(':::flipping points::: last_point was '+pointAsString(last_point))
       		var temp = origin
       		origin = end
       		end = temp
       		console.log('flip: '+pointAsString(origin)+' to '+pointAsString(end))
       		if ( ! makerjs.point.closest(last_point, [origin,end]) ) {
       			console.log('::: WARNING::: flipping points didnt solve the problem for path:'+path_name)
       		}
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
		// console.log('len: '+length)

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

// Create expanded model
var stroke_around_heart = 0.322
var expanded_model = makerjs.model.outline(pixel_heart, stroke_around_heart, 1)
expanded_model = expanded_model.models['0']	// grab the model, not this wrapper around it
// console.log('expanded model: '+JSON.stringify(expanded_model))

//call originate before calling simplify:
makerjs.model.originate(expanded_model);
makerjs.model.simplify(expanded_model);	// simplify paths that should be a single path after outline()

// module.exports.notchModel = notchModel

// DEBUG ONLY 
module.exports = notchModel(expanded_model, 0)