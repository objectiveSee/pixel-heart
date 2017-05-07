/**
 * Converts a SVG into the format of SVG that Joinery likes
 * See: http://www.instructables.com/id/Joinery-Joints-for-Laser-Cut-Assemblies/
 */

var makerjs 			= require('makerjs')
var _ 					= require('underscore')
var Parser 				= require('xml2json')
// var util 				= require('util')

// SVG export options
var export_options = {
	// strokeWidth: 3,
	units: 'mm',
	// stroke: 'red',
	useSvgPathOnly: false
}

var getPathsInObject = function(obj) {

	if ( !obj ) {
		return []
	}

	// console.log('diving deeper')
	var lines = []

	if ( Array.isArray(obj) ) {
		var children = _.map(obj, function(o) {
			return getPathsInObject(o)
		})
		if ( children ) {
			// console.log('iterated array and found '+children.length+' object')
			_.each(children, function(child) {
				// console.log('child had '+child.length+' lines')
				lines = lines.concat(child)
			})
		}
		return lines
	}


	if ( obj.line ) {
		var new_lines = _.map(obj.line, function(line) {
			return {
				x1: line.x1,
				x2: line.x2,
				y1: line.y1,
				y2: line.y2,
			}
		})	
		lines = lines.concat(new_lines)
		// console.log('found '+lines.length+' lines')
	} else {
		// console.log('nothing at this level: '+Object.keys(obj))
	}

	var childlines = getPathsInObject(obj.g)
	if ( childlines ) {
		lines = lines.concat(childlines)
	}
	return lines
}


var topHalf = function(object) {

	var width = object.svg.width //	 may be string
	var height = object.svg.height //	 may be string
	var viewbox = object.svg.viewBox


	var header = ''+
	'<svg xmlns="http://www.w3.org/2000/svg" width="800mm" height="800.2mm" viewBox="0 0 800 800.2">\n'+
	'<defs>\n'+
	'<style>\n'+
	' .a {\n'+
	'    fill: #fff;\n'+
	'    stroke: #000;\n'+
	'    stroke-miterlimit: 10;\n'+
	'  }\n'+
	'</style>\n'+
	'</defs>\n'+
	'<title>Pixel Heart</title>\n'

	return header

	// return '\n'+
	// 	'<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="'+viewbox+'">'+
	// 	'<defs> <style>\n'+
	// 	'  .a {'+
	// 	// '    fill: #f0;'+
	// 	'    stroke: #f00;'+
	// 	'    stroke-miterlimit: 10;'+
	// 	'	 stroke-width: 3'+
	// 	' }'+
	// 	'</style>'+
	// 	'</defs>'+
	// 	'<title>Pixel Heart</title>'
}

var bottomHalf = function(lines) {
	var string = '\n'

	_.each(lines, function(line) {
		string += '\n\t<line class="a" x1="'+line.x1+'" y1="'+line.y1+
		'" x2="'+line.x2+'" y2="'+line.y2+'"/>'
	})
	return string+'\n</svg>'
}


  // 
//   <line class="a" x1="0.5" y1="216.5" x2="144.5" y2="216.5"/>
//   <line class="a" x1="0.5" y1="360.5" x2="0.5" y2="216.5"/>
//   <line class="a" x1="144.5" y1="360.5" x2="0.5" y2="360.5"/>
//   <line class="a" x1="360.5" y1="360.5" x2="216.5" y2="360.5"/>
//   <line class="a" x1="360.5" y1="216.5" x2="360.5" y2="360.5"/>
//   <line class="a" x1="216.5" y1="216.5" x2="360.5" y2="216.5"/>
//   <line class="a" x1="216.5" y1="360.5" x2="216.5" y2="216.5"/>
//   <line class="a" x1="576.5" y1="216.5" x2="576.5" y2="360.5"/>
//   <line class="a" x1="432.5" y1="216.5" x2="576.5" y2="216.5"/>
//   <line class="a" x1="432.5" y1="360.5" x2="432.5" y2="216.5"/>
//   <line class="a" x1="576.5" y1="360.5" x2="432.5" y2="360.5"/>
//   <line class="a" x1="216.5" y1="432.5" x2="360.5" y2="432.5"/>
//   <line class="a" x1="216.5" y1="576.5" x2="216.5" y2="432.5"/>
//   <line class="a" x1="360.5" y1="576.5" x2="216.5" y2="576.5"/>
//   <line class="a" x1="360.5" y1="432.5" x2="360.5" y2="576.5"/>
//   <line class="a" x1="360.5" y1="0.5" x2="360.5" y2="144.5"/>
//   <line class="a" x1="216.5" y1="0.5" x2="360.5" y2="0.5"/>
//   <line class="a" x1="216.5" y1="144.5" x2="216.5" y2="0.5"/>
//   <line class="a" x1="360.5" y1="144.5" x2="216.5" y2="144.5"/>
//   <line class="a" x1="792.5" y1="360.5" x2="648.5" y2="360.5"/>
//   <line class="a" x1="792.5" y1="216.5" x2="792.5" y2="360.5"/>
//   <line class="a" x1="648.5" y1="216.5" x2="792.5" y2="216.5"/>
//   <line class="a" x1="648.5" y1="360.5" x2="648.5" y2="216.5"/>
// </svg>



function PrepForJoinery(model) {

	var svg = makerjs.exporter.toSVG(model,export_options)
	var svg_object = JSON.parse(Parser.toJson(svg))
	var paths = getPathsInObject(svg_object.svg.g)

	var top = topHalf(svg_object)
	var bottm = bottomHalf(paths)

	var final = top+'\n'+bottm
	console.log(final)
	return final




	// console.log('total paths is '+paths.length)

	// delete svg_object.svg.g
	// svg_object.svg.g = {}


	// // replace paths with top-level paths
	// svg_object.svg.g = {
	// 	line: paths,
	// 	stroke: 'red',
	// 	'stroke-width': '1'
	// }

	// console.log(svg_object)

	// Add CSS to the top of svg
	// svg_object.svg.defs = {
	// 	style: [JSON.stringify({'.a':{
	// 		fill: '#fff',
	// 		stroke: '#000',
	// 		'stroke-miterlimit': 10
	// 	}})]
	// }

	// var test = {
	// 	defs:{
	// 		style:'.a {        fill: #fff;        stroke: #000;        stroke-miterlimit: 10;      }'
	// 	}
	// }
	// svg_object.svg.defs = {
	// 		style:'.a {        fill: #fff;        stroke: #000;        stroke-miterlimit: 10;      }'
	// 	}
	// console.log(Parser.toXml(test))

	// Clean-up and ship it!

	// var string = JSON.stringify(svg_object,null,'\t')
	// // console.log(string)
	// var as_xml = Parser.toXml(string)
	// // console.log(as_xml)

	// return as_xml
}

if ( 0 ) {
	var heart = '<svg width="299mm" height="253mm" viewBox="0 0 299 253"><g id="svgGroup" stroke="red" stroke-width="3" stroke-linecap="round" fill="none" fill-rule="evenodd" font-size="9pt"><g id="0"><g id="heart"><line id="ShapeLine1" x1="0" y1="46" x2="23" y2="46" vector-effect="non-scaling-stroke"/><line id="ShapeLine2" x1="23" y1="46" x2="23" y2="23" vector-effect="non-scaling-stroke"/><line id="ShapeLine3" x1="23" y1="23" x2="46" y2="23" vector-effect="non-scaling-stroke"/><line id="ShapeLine4" x1="46" y1="23" x2="46" y2="0" vector-effect="non-scaling-stroke"/><line id="ShapeLine5" x1="46" y1="0" x2="115" y2="0" vector-effect="non-scaling-stroke"/><line id="ShapeLine6" x1="115" y1="0" x2="115" y2="23" vector-effect="non-scaling-stroke"/><line id="ShapeLine7" x1="115" y1="23" x2="184" y2="23" vector-effect="non-scaling-stroke"/><line id="ShapeLine8" x1="184" y1="23" x2="184" y2="0" vector-effect="non-scaling-stroke"/><line id="ShapeLine9" x1="184" y1="0" x2="253" y2="0" vector-effect="non-scaling-stroke"/><line id="ShapeLine10" x1="253" y1="0" x2="253" y2="23" vector-effect="non-scaling-stroke"/><line id="ShapeLine11" x1="253" y1="23" x2="276" y2="23" vector-effect="non-scaling-stroke"/><line id="ShapeLine12" x1="276" y1="23" x2="276" y2="46" vector-effect="non-scaling-stroke"/><line id="ShapeLine13" x1="276" y1="46" x2="299" y2="46" vector-effect="non-scaling-stroke"/><line id="ShapeLine14" x1="299" y1="46" x2="299" y2="115" vector-effect="non-scaling-stroke"/><line id="ShapeLine15" x1="299" y1="115" x2="276" y2="115" vector-effect="non-scaling-stroke"/><line id="ShapeLine16" x1="276" y1="115" x2="276" y2="138" vector-effect="non-scaling-stroke"/><line id="ShapeLine17" x1="276" y1="138" x2="253" y2="138" vector-effect="non-scaling-stroke"/><line id="ShapeLine18" x1="253" y1="138" x2="253" y2="161" vector-effect="non-scaling-stroke"/><line id="ShapeLine19" x1="253" y1="161" x2="230" y2="161" vector-effect="non-scaling-stroke"/><line id="ShapeLine20" x1="230" y1="161" x2="230" y2="184" vector-effect="non-scaling-stroke"/><line id="ShapeLine21" x1="230" y1="184" x2="207" y2="184" vector-effect="non-scaling-stroke"/><line id="ShapeLine22" x1="207" y1="184" x2="207" y2="207" vector-effect="non-scaling-stroke"/><line id="ShapeLine23" x1="207" y1="207" x2="184" y2="207" vector-effect="non-scaling-stroke"/><line id="ShapeLine24" x1="184" y1="207" x2="184" y2="230" vector-effect="non-scaling-stroke"/><line id="ShapeLine25" x1="184" y1="230" x2="161" y2="230" vector-effect="non-scaling-stroke"/><line id="ShapeLine26" x1="161" y1="230" x2="161" y2="253" vector-effect="non-scaling-stroke"/><line id="ShapeLine27" x1="161" y1="253" x2="138" y2="253" vector-effect="non-scaling-stroke"/><line id="ShapeLine28" x1="138" y1="253" x2="138" y2="230" vector-effect="non-scaling-stroke"/><line id="ShapeLine29" x1="138" y1="230" x2="115" y2="230" vector-effect="non-scaling-stroke"/><line id="ShapeLine30" x1="115" y1="230" x2="115" y2="207" vector-effect="non-scaling-stroke"/><line id="ShapeLine31" x1="115" y1="207" x2="92" y2="207" vector-effect="non-scaling-stroke"/><line id="ShapeLine32" x1="92" y1="207" x2="92" y2="184" vector-effect="non-scaling-stroke"/><line id="ShapeLine33" x1="92" y1="184" x2="69" y2="184" vector-effect="non-scaling-stroke"/><line id="ShapeLine34" x1="69" y1="184" x2="69" y2="161" vector-effect="non-scaling-stroke"/><line id="ShapeLine35" x1="69" y1="161" x2="46" y2="161" vector-effect="non-scaling-stroke"/><line id="ShapeLine36" x1="46" y1="161" x2="46" y2="138" vector-effect="non-scaling-stroke"/><line id="ShapeLine37" x1="46" y1="138" x2="23" y2="138" vector-effect="non-scaling-stroke"/><line id="ShapeLine38" x1="23" y1="138" x2="23" y2="115" vector-effect="non-scaling-stroke"/><line id="ShapeLine39" x1="23" y1="115" x2="0" y2="115" vector-effect="non-scaling-stroke"/><line id="ShapeLine40" x1="0" y1="115" x2="0" y2="46" vector-effect="non-scaling-stroke"/></g></g></g></svg>'
	var boxes = '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="11.01in" height="8.01in" viewBox="0 0 793 577"><defs><style>.a {        fill: #fff;        stroke: #000;stroke-miterlimit: 10;      }</style></defs><title>cube_2in</title><line class="a" x1="144.5" y1="216.5" x2="144.5" y2="360.5" /><line class="a" x1="0.5" y1="216.5" x2="144.5" y2="216.5" /><line class="a" x1="0.5" y1="360.5" x2="0.5" y2="216.5" /><line class="a" x1="144.5" y1="360.5" x2="0.5" y2="360.5" /><line class="a" x1="360.5" y1="360.5" x2="216.5" y2="360.5" /><line class="a" x1="360.5" y1="216.5" x2="360.5" y2="360.5" /><line class="a" x1="216.5" y1="216.5" x2="360.5" y2="216.5" /><line class="a" x1="216.5" y1="360.5" x2="216.5" y2="216.5" /><line class="a" x1="576.5" y1="216.5" x2="576.5" y2="360.5" /><line class="a" x1="432.5" y1="216.5" x2="576.5" y2="216.5" /><line class="a" x1="432.5" y1="360.5" x2="432.5" y2="216.5" /><line class="a" x1="576.5" y1="360.5" x2="432.5" y2="360.5" /><line class="a" x1="216.5" y1="432.5" x2="360.5" y2="432.5" /><line class="a" x1="216.5" y1="576.5" x2="216.5" y2="432.5" /><line class="a" x1="360.5" y1="576.5" x2="216.5" y2="576.5" /><line class="a" x1="360.5" y1="432.5" x2="360.5" y2="576.5" /><line class="a" x1="360.5" y1="0.5" x2="360.5" y2="144.5" /><line class="a" x1="216.5" y1="0.5" x2="360.5" y2="0.5" /><line class="a" x1="216.5" y1="144.5" x2="216.5" y2="0.5" /><line class="a" x1="360.5" y1="144.5" x2="216.5" y2="144.5" /><line class="a" x1="792.5" y1="360.5" x2="648.5" y2="360.5" /><line class="a" x1="792.5" y1="216.5" x2="792.5" y2="360.5" /><line class="a" x1="648.5" y1="216.5" x2="792.5" y2="216.5" /><line class="a" x1="648.5" y1="360.5" x2="648.5" y2="216.5" /></svg>'
	var x = PrepForJoinery(heart)
	// console.log(JSON.stringify(x,null,'\t'))
	// console.log(x)
}

module.exports = PrepForJoinery