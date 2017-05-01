var makerjs 			= require('makerjs')

/**
 * Flattens a makerjs model by exporting it to a SVG path and re-importing it.
 */
module.exports = function(model) {
	var svg = makerjs.exporter.toSVGPathData(model)
	if ( Object.keys(svg).length != 1 ) {
		throw new Error('expecting 1 key only')
	}
	var svg_path = svg[Object.keys(svg)[0]]
	var new_model = makerjs.importer.fromSVGPathData(svg_path)
	return new_model
}