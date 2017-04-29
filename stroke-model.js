var makerjs 			= require('makerjs')

/**
 * mod using negative works with this
 */ 
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n
}

/**
 * calculate how much to subtract or add off of each end of the line
 * from previous to current point based on the direction of the next and
 * previoius lines.
 * 
 * This was hard to figure out logically so i broke it out into many
 * conditional statement to cover each case and figrued out the sign on the `stroke`
 * value to use.
 * 
 */
var adjustmentPoint = function(previous, current, next, isHorizontal, stroke) {

    // console.log('previous: '+previous+' current:'+current
                    // +' next:'+next+', horizontal='+isHorizontal)
  
	if ( isHorizontal ) {
     if ( previous[0] < current[0] ) {
        if (next[1] < current[1]) {
          return [stroke,stroke]
        } else {
          return [-stroke, stroke]
        }
      } else {
        
        if (next[1] < current[1]) {
          return [stroke,-stroke]
        } else {
          return [-stroke, -stroke]
        }
      }
	} else {
      if ( previous[1] < current[1] ) {
        if (next[0] < current[0]) {
          return [-stroke,-stroke]
        } else {
          return [-stroke, stroke]
        }
      } else {
        
        if (next[0] < current[0]) {
          return [stroke,-stroke]
        } else {
          return [stroke, stroke]
        }
      }
	
    }
}

/**
 * Apply a stroke around model without rounding or loss of 90 degree edges.
 */
var strokeModel = function(model, stroke) {

	var chain = makerjs.model.findSingleChain(model)
	var points = makerjs.chain.toKeyPoints(chain)	
    var new_points = []
    var length = points.length
	if ( length % 2 != 0 ) {
      throw new Error('invalid chain length')
    }
    var i = 0
    isHorizontal = false
    points.forEach(function(this_point) {

    	var previous_index = (i-1).mod(points.length)
    	var previous_point = points[previous_index]
    	var next_index = (i+1).mod(points.length)
    	var next_point = points[next_index]

		var adjustment_point = adjustmentPoint(previous_point, 
                                               this_point, 
                                               next_point, 
                                               isHorizontal, 
                                               stroke)

		var new_end = makerjs.point.add(this_point, adjustment_point)

		new_points.push(new_end)

        isHorizontal = !isHorizontal
    	i++
    })
    
 	var c = new makerjs.models.ConnectTheDots(true,new_points)
 	return c
}

if ( 0 ) {
	// debug setup for playground
	var heart = {"paths":{"ShapeLine1":{"type":"line","origin":[0,9],"end":[1,9]},"ShapeLine2":{"type":"line","origin":[1,9],"end":[1,10]},"ShapeLine3":{"type":"line","origin":[1,10],"end":[2,10]},"ShapeLine4":{"type":"line","origin":[2,10],"end":[2,11]},"ShapeLine5":{"type":"line","origin":[2,11],"end":[5,11]},"ShapeLine6":{"type":"line","origin":[5,11],"end":[5,10]},"ShapeLine7":{"type":"line","origin":[5,10],"end":[8,10]},"ShapeLine8":{"type":"line","origin":[8,10],"end":[8,11]},"ShapeLine9":{"type":"line","origin":[8,11],"end":[11,11]},"ShapeLine10":{"type":"line","origin":[11,11],"end":[11,10]},"ShapeLine11":{"type":"line","origin":[11,10],"end":[12,10]},"ShapeLine12":{"type":"line","origin":[12,10],"end":[12,9]},"ShapeLine13":{"type":"line","origin":[12,9],"end":[13,9]},"ShapeLine14":{"type":"line","origin":[13,9],"end":[13,6]},"ShapeLine15":{"type":"line","origin":[13,6],"end":[12,6]},"ShapeLine16":{"type":"line","origin":[12,6],"end":[12,5]},"ShapeLine17":{"type":"line","origin":[12,5],"end":[11,5]},"ShapeLine18":{"type":"line","origin":[11,5],"end":[11,4]},"ShapeLine19":{"type":"line","origin":[11,4],"end":[10,4]},"ShapeLine20":{"type":"line","origin":[10,4],"end":[10,3]},"ShapeLine21":{"type":"line","origin":[10,3],"end":[9,3]},"ShapeLine22":{"type":"line","origin":[9,3],"end":[9,2]},"ShapeLine23":{"type":"line","origin":[9,2],"end":[8,2]},"ShapeLine24":{"type":"line","origin":[8,2],"end":[8,1]},"ShapeLine25":{"type":"line","origin":[8,1],"end":[7,1]},"ShapeLine26":{"type":"line","origin":[7,1],"end":[7,0]},"ShapeLine27":{"type":"line","origin":[7,0],"end":[6,0]},"ShapeLine28":{"type":"line","origin":[6,0],"end":[6,1]},"ShapeLine29":{"type":"line","origin":[6,1],"end":[5,1]},"ShapeLine30":{"type":"line","origin":[5,1],"end":[5,2]},"ShapeLine31":{"type":"line","origin":[5,2],"end":[4,2]},"ShapeLine32":{"type":"line","origin":[4,2],"end":[4,3]},"ShapeLine33":{"type":"line","origin":[4,3],"end":[3,3]},"ShapeLine34":{"type":"line","origin":[3,3],"end":[3,4]},"ShapeLine35":{"type":"line","origin":[3,4],"end":[2,4]},"ShapeLine36":{"type":"line","origin":[2,4],"end":[2,5]},"ShapeLine37":{"type":"line","origin":[2,5],"end":[1,5]},"ShapeLine38":{"type":"line","origin":[1,5],"end":[1,6]},"ShapeLine39":{"type":"line","origin":[1,6],"end":[0,6]},"ShapeLine40":{"type":"line","origin":[0,6],"end":[0,9]}}}
	var desired_width = 180
	var HEART_WIDTH = 13
  	var scale = desired_width/HEART_WIDTH
	makerjs.model.scale(heart, scale)
	module.exports = strokeModel(heart, 1)	
} else {
	module.exports = strokeModel
}
