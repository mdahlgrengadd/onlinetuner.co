//
// Copyright (c) 2014 Sylvain Peyrefitte
//
// This file is part of onlinetuner.co.
//
// onlinetuner.co is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.
//

//controller.js
//Interface between analyser and widgets
//duplicate from analyser.js
var NOTE = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
	//Compute Note from step compute from La 440hz (A4)
	var computeNote = function(step) {
		var idx = Math.round(step) % NOTE.length;
		if(idx < 0)
			return NOTE[12 + idx];
		else
			return NOTE[idx];
	};


var HelmholtzScale = [
//	1.0000,
	25/24,
	9/8,
	6/5,
	5/4,
	4/3,
	45/32,
	3/2,
	8/5,
	5/3,
	9/5,
	15/8,
	2.0000,
	2*(25/24)
];

var EqTemperateScale = [
//	1.0,
	Math.pow(2, 1/12),
	Math.pow(2, 2/12),
	Math.pow(2, 3/12),
	Math.pow(2, 4/12),
	Math.pow(2, 5/12),
	Math.pow(2, 6/12),
	Math.pow(2, 7/12),
	Math.pow(2, 8/12),
	Math.pow(2, 9/12),
	Math.pow(2, 10/12),
	Math.pow(2, 11/12),
	Math.pow(2, 12/12),
	Math.pow(2, 13/12),
];

console.log("EQ-Scale");
console.log(EqTemperateScale);
console.log("HelmholtzScale");
console.log(HelmholtzScale);

// Note elision, there is no member at 2 so it isn't visited
//HelmholtzScale.forEach(logArrayElements);

function tonestepArray(array) { // array must contatin 13 indexes
	var newarr = new Array();
	var diff = 0;
	for (var i = 0; i < 12; i++) {

		diff = array[i+1] / array[i];
		newarr.push(diff);
	};
	return newarr;
}


function tonescaleArray(start, array) {
	var newarr = new Array();
	for (var i = 0; i < 12; i++) {

		diff = array[(start+i) % array.length]
		console.log("THEDIFF: "+diff+" - vs eq: "+Math.pow(2, 1/12))
		newarr.push(diff);//diff
	};
	return newarr;
}



var helmholtzSteps = tonestepArray(HelmholtzScale);
console.log("HelmholtzScale Diffs:----------");
console.log(helmholtzSteps);
var sum = helmholtzSteps.reduce(function(a, b) {
			  return a * b;
});
console.log("All diffs multiplied eq="+sum)

var eq = tonestepArray(EqTemperateScale);
console.log("EqualScale Diffs:----------");
console.log(eq);
sum = eq.reduce(function(a, b) {
			  return a * b;
});

console.log("All diffs multiplied eq="+sum)


var Scales = new Array();
for (var p = 0; p < 12; p++) {
	Scales.push(tonescaleArray(p, helmholtzSteps));
	//console.log(Scales[p]);
};

var weights = [
	1.0, 
	0.0, 
	0.0,
	0.0,
	0.0,
	0.0,
	0.0,
	0.0,
	0.0,
	0.0,
	0.0,
	0.0
	];

function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
}

function avg_scales(scales, weigths) {
	var i; 
	var average = [];

	for(i = 0; i < scales[0].length; i++){
		var avg = 0;
		for (var k = scales.length - 1; k >= 0; k--) {
			avg += scales[k][i] * weights[k];
		};
		var sum_of_weights = weights.reduce(function(a, b) {
			  return a + b;
		});

		console.log("AVG1="+avg);
		avg = (avg / sum_of_weights);//getBaseLog(sum_of_weights,avg);
		average.push(avg);/// (sum_of_weights));
		console.log("AVG2="+avg);
		console.log(sum_of_weights);
	}
	return average;
}

var avgscale2 = avg_scales(Scales, weights);

//http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
};


function pitchFromStepArray(start, array) {
	var modstart = Number(start).mod(array.length);
	var absval = Math.floor(start/array.length);
	console.log("ABSVAL: "+absval);
	var newarr = new Array();
	var diff = 1;
	for (var i = 0; i < modstart; i++) {

		diff *= array[(modstart+i) % array.length]

	};
	console.log("diff: "+diff);
	return diff*Math.pow(2,absval);//(Math.pow(2, diff)/2)*Math.pow(2,absval);
0.5;
}

console.log(avgscale2);




function pitcher(firstNote, range, scale, basefreq) {
	var initialNoteFreq = 440.0 ;// Low A
				var myStepArray = new Array();
			var myNoteArray = new Array();

	for (var note = firstNote; note <range; note++) {



			var pitch = pitchFromStepArray(note, avgscale2);
			var eqtemp = Math.pow(2, note/12); //1.059... the equal temperament multiplier
			var diff = (pitch-eqtemp);



			myStepArray.push((note+diff*12));
			myNoteArray.push(computeNote(note));



			//rounding for print
			pitch = Math.round(pitch*initialNoteFreq * 100) / 100;
			eqtemp = Math.round(eqtemp*initialNoteFreq * 100) / 100;
			diff = Math.round(diff*initialNoteFreq * 100) / 100;

			console.log("note: "+computeNote(note)+" - "+pitch+" Hz / + "+eqtemp+" ("+diff+")");



		};

		return {'stepArray': myStepArray, 'noteArray': myNoteArray}
}



/*
var note = 2;
var pitch = pitchFromStepArray(note, Scales[0]);

console.log(pitch*440.0);
pitch = pitchFromStepArray(note, Scales[6]);

console.log(pitch*440.0);
pitch = pitchFromStepArray(note, avgscale);

console.log(pitch*440.0);

*/


(function () {
	var res = pitcher(-36, 48, avgscale2, 440.0 );
	console.log(res);
    
    //Step compute from La 440 Hz
    var GUITARE_STEP = res['stepArray'];//[24, 23, 22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0,-1,-2,-3,-4,-5,-6,-7,-8,-9,-10,-11,-12,-13,-14,-15,-16,-17,-18,-19,-20,-21,-22,-23,-24,-25,-26,-27,-28,-29,-30,-31,-32,-33,-34,-35,-36];
    console.log(GUITARE_STEP);
    //notes of guitare strings
    var GUITARE_NOTE = res['noteArray'];//["A", "G#","G","F#","F","E","D#","D","C#","C","B","A#","A", "G#","G","F#","F","E","D#","D","C#","C","B","A#","A", "G#","G","F#","F","E","D#","D","C#","C","B","A#","A", "G#","G","F#","F","E","D#","D","C#","C","B","A#","A"];
    
    //compute guitare string and delta from note step (la 440Hz)
    var computeGuitareString = function(info) {
        //search nearest note
        var diff = GUITARE_STEP.map(function(e) {
            return Math.abs(e - info.step);
        });
        
        var string = diff.indexOf(Math.min.apply(null, diff));
        
        //compute error
        var delta = GUITARE_STEP[string] - info.step;
        if(Math.abs(delta) - info.stepError < 0) {
            delta = 0;
        }
        
        return { string : string + 1, note : GUITARE_NOTE[string], delta : delta };
    };
    
    //Controller
    var Controller = function() {       
    };
    
    //interface
    Controller.prototype = {
        notify : OnlineTuner.virtual
    };
    
    //Guitare tuner view
    var NyckelharpaTuner = function(widget) {
        Controller.call(this);
        //target of drawing
        this.widget = widget;
    };
    
    NyckelharpaTuner.prototype = {
        // draw guitare tubner state
        notify : function(info) {

            var guitareInfo = computeGuitareString(info);
            //console.log(info.step);
            
            //update associate widget
            this.widget.show(- (guitareInfo.delta) / 5.0, guitareInfo.note, "string " + guitareInfo.string, info.note + "" + info.octave + "(" + Math.round(info.frequency) + "Hz)");
        }
    };
    
    //Namespace declaration
    OnlineTuner.Controller = {NyckelharpaTuner : NyckelharpaTuner};
})();
