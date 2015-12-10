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



// This table is used to pick which keys to favour in the tuning process,
// a value of 1.0 means the tuner should favour it, 0 means it shouldn't. Its
// used in the avg_scales function. If all keys should be favored, then 
// the values in the table should sum up to 12!!
var weight_table1 = [
	1.0, // A ( if the the base freq is 440hz )  
	0.0, // A#
	0.0, // B
	0.0, // C
 	0.0, // C#
	0.0, // D
	0.0, // D#
	0.0, // E
	0.0, // F
	0.0, // F#
	0.0, // G
	0.0  // G#
	];

// This table is for the avg_scales2 function which 
// works differently for avg_scales. avg_scales2 will
// give exactly the equal temperament coefficient if
// all keys are weighted equal. The avg_scales function
// gives only an approximate.
// Note that this table consists of percentage values, ie all 
// values in the table should sum up to 1, not 12!!

var weight_table2 = [
	12.0/12, // A ( if the the base freq is 440hz )  
	0.0/12, // A#
	0.0/12, // B
	0.0/12, // C *
 	0.0/12, // C#
	0.0/12, // D *
	0.0/12, // D#
	0.0/12, // E
	0.0/12, // F *
	0.0/12, // F#
	0.0/12, // G *
	0.0/12  // G#
	];

/*
var weight_table2 = [
	3.0/12, // A ( if the the base freq is 440hz )  
	0.0/12, // A#
	0.0/12, // B
	3.0/12, // C *
 	0.0/12, // C#
	2.0/12, // D *
	0.0/12, // D#
	2.0/12, // E
	0.0/12, // F *
	0.0/12, // F#
	2.0/12, // G *
	0.0/12  // G#
	];
*/




// The perfect/just intonation scale
// i.e. every interval sounds perfect/pure, though
// only in one key at a time. 
var HelmholtzScale = [
	1.0000,
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

// If you divide every value in Helmholts Scale with the value before it
// you arrive at this table... This is what the "tonestepArray" function
// does with any custom table, but here we can precalculate since the 
// table us known to us. Similiar precalculation can be done for the 
// equal temperate scale as well. All values in that table would be Math.pow(2, 1/12).
var HelmholtzPreCalcSteps = [
25/24,  // ie. (25/24) / 1     = 1.0416666666666667, 
27/25,  // ie. (9/8) / (25/24) = 1.0799999999999998, 
16/15,  // ie. (6/5) / (9/8)   = 1.0666666666666667, 
25/24,  // ie. (5/4) / (6/5)   = 1.0416666666666667, 
16/15,  // ie. (4/3) / (5/4)   = 1.0666666666666667, 
135/128,// ie. (45/32) / (4/3) = 1.0546875, 
16/15,  // ie. (3/2) / (45/32) = 1.0666666666666667, 
16/15,  // ie. (8/5) / (3/2)   = 1.0666666666666667, 
25/24,  // ie. (5/3) / (8/5)   = 1.0416666666666667, 
27/25,  // ie. (9/5) / (5/3)   = 1.08, 
25/24,  // ie. (15/8) / (9/5)  = 1.0416666666666667, 
16/15   // ie. (2) / (15/8)    = 1.0666666666666667
];



//The equal temperament scale
//i.e. every intervall sounds equally good or 
//bad in every in every key.
var EqTemperateScale = [
	1.0,
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

var EqTemperateSteps = [
	Math.pow(2, 1/12),
	Math.pow(2, 1/12),
	Math.pow(2, 1/12),
	Math.pow(2, 1/12),
	Math.pow(2, 1/12),
	Math.pow(2, 1/12),
	Math.pow(2, 1/12),
	Math.pow(2, 1/12),
	Math.pow(2, 1/12),
	Math.pow(2, 1/12),
	Math.pow(2, 1/12),
	Math.pow(2, 1/12)
];


// Some observations...
// If you divide the intervals in the HelmholtzScale (Perfect tuning) with 
// the one before, ie (25/24) / 1 ...or... (9/8) / (25/24), then
// only four different values will emerge, namely:
//
//  1.0416666666666667 (four times), 
//  1.08 (2 times), 
//  1.0666666666666667 (five times), 
//  1.0546875 (once)
//
// these values can be written as fractions like:
// [25/24, 27/25, 16/15, 135/128]
//
// The average of all those values as they appear in a complete octave
// can be used to approximate the equal temperament ratio multiplier (EQRM).
// EQRM is the value used to multiply a frequency to get the next frequency 
// in the scale. The exact value is = Math.pow(2, 1/12) = 1.0594630943592953.
//
// So... 
// (25/24 * 4 + 27/25 * 2 + 16/15 * 5 + 135/128) / 12 = 1.0595572916666667
// ..is almost the same as Math.pow(2, 1/12).
//
// Of course multiplying all interval differencies that occurs in an octave
// results in the octave multiplier = 2.
// (25/24)^4 * (27/25)^2 * (16/15)^5 * 135/128 = 
// = Math.pow(2, 1/12)^12 = 
// = 2



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



function tonestepArray(array) { 
	var newarr = new Array();
	var diff = 0;
	for (var i = 0; i < 12; i++) {

		diff = array[i+1] / array[i];
		newarr.push(diff);
	};
	return newarr;
}


//http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
};


function tonescaleArray(start, array) {
	var newarr = new Array();
	for (var i = 0; i < 12; i++) {

		diff = array[Number(start+i).mod(12)]
		//console.log("THEDIFF: "+diff+" - vs eq: "+Math.pow(2, 1/12))
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




function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
}

function avg_scales(scales, weights) {
	var tonestep; 
	var average = [];

	for(tonestep = 0; tonestep < 12; tonestep++){
		var avg = 0;
		for (var keyscale = 0; keyscale < 12 ; keyscale++) {
			avg += scales[keyscale][tonestep] * weights[keyscale];
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


function avg_scales2(scales, weights) {
	var average = [];

	for(var tonestep = 0; tonestep < 12; tonestep++){
		var avg = 1;
		for (var keyscale = 0; keyscale < 12 ; keyscale++) {
			// Since all pitch intervals are multiplied with eachother, 
			// this makes sure a weight of 0 will result in that 
			// the average will be the same:
			// Math.pow( x , 1 + 1) / x  = x
			// Math.pow( x , 1 + 0) / x  = 1
			var x = scales[keyscale][tonestep];
			avg *=  Math.pow(x, 1+weights[keyscale])/x;

		};
		var sum_of_weights = weights.reduce(function(a, b) {
			  return a + b;
		});

	    // Calculate the average... if all weights are set to 1, then:
	    // avg = 2 (because all intervals in the octave are multiplied),
	    // sum_of_weights = 12, and the equation below will look like:
	    // avg = 2 * Math.pow(2, (12/12)/12) )/2 = Math.pow(2, 1/12 ) = 1.0594630943592953
	    // which is the equal temperament multiplier...
	    // On the other hand, if only one of the weights are set, then the equation
	    // will look like:
	    // avg = (avg * Math.pow(2, (12/ 1 )/12) )/2 =  (avg * 2^1 )/2 = avg * 1 = avg
	    // this means that avg equals the interval of the selected key.
	    avg = (avg * Math.pow(2, (12/sum_of_weights)/12) )/2;
		average.push(avg);
	}
	return average;
}



var avgscale2 = avg_scales2(Scales, weight_table2);


/*
function pitchFromStepArray(start, array) {
	var modstart = Number(start).mod(12);
	var absval = Math.floor(start/12);
	var newarr = new Array();
	var diff = 1;
	for (var i = 0; i < modstart; i++) {
		
		console.log("modstart: "+(modstart+i) % 12);
		diff *= array[(modstart+i) % 12]

	};
	console.log("diff: "+diff);
	return diff*Math.pow(2,absval);//(Math.pow(2, diff)/2)*Math.pow(2,absval);

}
*/

//http://steelguitarforum.com/Forum11/HTML/009148.html
function hertzDifftoCents(freq1, freq2) {
/*
	The approximate conversion factor 4 is based on differences from a center frequency of about 440 Hz. It's different for different center frequencies. One can compute Cents change in going from frequency f0 to frequency f1 using logarithms in the following formula:
Cents = K*(log(f1)-log(f0))

where 1200 = K*log(2)

If one uses common logarithms (base 10), this constant comes out to

K = 1200/log10(2) or approximately 3986.3

So, using 440 as the center frequency, f0, then the number of Cents change going to 441 Hz is

Cents(440-to-441) = 3986.3*(log10(441)-log10(440))

or about 3.93 Cents.

Here's a table of Cents difference for some frequencies around 440 Hz:

435 Hz: -19.78 Cents
436 Hz: -15.81 Cents
437 Hz: -11.84 Cents
438 Hz: -7.89 Cents
439 Hz: -3.94 Cents
440 Hz: 0 Cents
441 Hz: +3.93 Cents
442 Hz: +7.85 Cents
443 Hz: +11.76 Cents
444 Hz: +15.67 Cents
445 Hz: +19.56 Cents

So, the conversion factor 4 Cents/Hz is just fine for our purposes of tuning around 440 Hz.

But note that this conversion factor is not constant - for example, for a center frequency one octave lower, 220 Hz, the factor doubles:

3986.3*(log10(221)-log10(220)) or about 7.85

Similarly, for a center frequency one octave higher, the factor is cut in half:

3986.3*(log10(881)-log10(880)) or about 1.97
	

*/

		return 3986.3*(Math.log10(freq1)-Math.log10(freq2));
}

// Returns the ratio used to multiply one frequency with 
// in order to get the frequency of the note step based on 
// the supplied scale.   
function getNotestepRatio(notestep, scale) {
			var notekey = Number(notestep).mod(12);
			var octave = Math.floor((notestep)/12);
			var ratio = 1;

			if (notekey>0) {
				ratio = scale.slice(0,notekey).reduce(function(a, b) {
					var tmp = a * b;
				    return tmp;
				});

			}  

			return ratio*Math.pow(2,octave);
}



function pitchComparer(scale, initialNoteFreq) {

	var myStepArray = new Array();
	var myNoteArray = new Array();

	//Array of which keys to go through... 0 = A, 1 = A# etc...
	// -3 = the subtonic or parallel key ie, A minor, in C major 
	[-3, -0].forEach(function (note, index, array) {
	
			var notekey = Number(note).mod(12);
			var octave = Math.floor((note)/12);
			

			var pitch = getNotestepRatio(note, scale);
			var truepitch = getNotestepRatio(note, helmholtzSteps); 

			//console.log("notekey="+notekey+" pitch multiplier="+pitch);

			var difftp = (pitch-truepitch);//*Math.pow(2,octave);

			var eqtemp = Math.pow(2, note/12); //1.059... the equal temperament multiplier
			var diffeq = (pitch)-eqtemp;


///////////////////////////////////////////////////////////////////////////////////
// testing....
//////////////////////////////////////////////////////////////////////////////////

			function traverse(INTERVAL, index, array) {
			// Note elision, there is no member at 2 so it isn't visited
						var fifthnote = Number(note+INTERVAL).mod(12);
						var fifthoctave = Math.floor((note+INTERVAL)/12);


						var ratio = tonescaleArray(-note, scale).slice(0,INTERVAL).reduce(function (a,b){return a*b});///Math.pow(2,octave);


						var fifthpitch = getNotestepRatio(note+INTERVAL, scale);//*Math.pow(2,fifthoctave);
						var fifthtruepitch = getNotestepRatio(INTERVAL, helmholtzSteps);//*Math.pow(2,octave);

						var fifthintervall = fifthpitch / pitch;
						var fifthtrueintervall = fifthtruepitch;// / pitch;
						var centsOffFifth = Math.round(hertzDifftoCents(fifthtrueintervall, ratio)*100)/100;
						//console.log("ratio: " + ratio + " fifthpitch: " + fifthpitch);

						//rounding for print

						//console.log("note: "+computeNote(note)+" - "+pitch+" Hz / + "+truepitch+" ("+difftp+" / "+centsFromPerfectPitch+" cents ) - equaltemp: "+eqtemp + "(" + diffeq + " / "+centsFromEQPitch+" cents)");


						//fifthintervall = Math.round(fifthintervall * 100) / 100;
						console.log(computeNote(fifthnote) + " : " + computeNote(note) + " ratio: " + ratio +" ( " + fifthtrueintervall + " ) " + " ( "+centsOffFifth+" cents )");
			}



			[2, 3, 4, 5, 7, 8, 9, 10, 11, 12].forEach(traverse);
			//[7].forEach(traverse);


		});
		
}






//pitchComparer(EqTemperateSteps, 440.0);
pitchComparer(avgscale2, 440.0);

function pitcher(firstNote, range, scale, initialNoteFreq) {
	var myStepArray = new Array();
	var myNoteArray = new Array();

	for (var note = firstNote; note <range; note++) {
	
			var notekey = Number(note).mod(12);
			var octave = Math.floor((note)/12);
			

			var pitch = getNotestepRatio(note, scale);
			var truepitch = getNotestepRatio(note, helmholtzSteps); 

			//console.log("notekey="+notekey+" pitch multiplier="+pitch);

			var difftp = (pitch-truepitch);//*Math.pow(2,octave);

			var eqtemp = Math.pow(2, note/12); //1.059... the equal temperament multiplier
			var diffeq = (pitch)-eqtemp;

			myStepArray.push((note+diffeq*12)); // FIXME: Should double check if this is correct
			myNoteArray.push(computeNote(note));

			//rounding for print
			//pitch = pitch*Math.pow(2,octave);
			//truepitch = truepitch*Math.pow(2,octave);
			pitch = Math.round(pitch*initialNoteFreq * 100) / 100;
			truepitch = Math.round(truepitch*initialNoteFreq * 100) / 100;
			eqtemp = Math.round(eqtemp*initialNoteFreq * 100) / 100;
			diffeq = Math.round(diffeq*initialNoteFreq * 100) / 100;
			difftp = Math.round(difftp*initialNoteFreq * 100) / 100;
			centsFromPerfectPitch = Math.round(hertzDifftoCents(truepitch, pitch)*100)/100;
			centsFromEQPitch = Math.round(hertzDifftoCents(eqtemp, pitch)*100)/100;
			//console.log("note: "+computeNote(note)+" - "+pitch+" Hz / + "+truepitch+" ("+difftp+" / "+centsFromPerfectPitch+" cents ) - equaltemp: "+eqtemp + "(" + diffeq + " / "+centsFromEQPitch+" cents)");

		};

		return {'stepArray': myStepArray, 'noteArray': myNoteArray}
}





(function () {
	var res = pitcher(-45, 28, avgscale2, 440.0 );
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


