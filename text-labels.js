var makerjs 			= require('makerjs')
var opentype 			= require('opentype.js')


var font = opentype.loadSync('./fonts/StardosStencil-Regular.ttf')
var font_size = 5
var buildTextForModels = function(boxes) {

	var root_object = boxes.models

	console.log('Generating text...')

	var new_models = {
		models: {}
	}
	var i = 0
	Object.keys(root_object).forEach(function(box_key) {
		var box = root_object[box_key]
		if ( !box.part_id ) {
			console.log('box has no part_id')
		} else {
			// console.log('box part_id '+box.part_id)
			var label_model = new makerjs.models.Text(font, box.part_id, font_size)
			if ( !label_model ) {
				throw new Error('failed to make text')
			}
			var extents = makerjs.measure.modelExtents(box)
			var extents2 = makerjs.measure.modelExtents(label_model)
			var center = [extents.center[0]-extents2.width/2,extents.center[1]-extents2.height/2]
			makerjs.model.move(label_model,center)
			new_models.models['text'+i] = label_model
			i++
		}
	})
	console.log('Text done')
	return new_models
}

module.exports.buildTextForModels = buildTextForModels