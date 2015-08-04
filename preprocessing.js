//
// Program preprocessing routines
//

var clean = function(p) {

    // This should remove comments starting with a semi-colon and
    // ending at a line break or at the end of p
    p = p.replace(/;[^\n\f\r]*[\n\f\r]/g, '');
    p = p.replace(/;.*$/, '');

    // This should remove everything that is not a 1 or a #
    p = p.replace(/[^1#]/g, '');
    
    return p;
};

var ones_hashes = function(p, pos) {

    var n_ones = 0;
    var n_hashes = 0;

    while (pos < p.length && p[pos]=='1') {
        n_ones++;
        pos++;
    }
    while (pos < p.length && p[pos]=='#' && n_hashes < 5) {
        n_hashes++;
        pos++;
    }

    return [n_ones, n_hashes, pos]
};

var parse = function(p) {

    var parsed = [];
    var inst = [0, 0, 0];
    var n_ones = 0;
    var n_hashes = 0;
    var pos = 0
    var new_pos = 0;

    while (pos < p.length) {

    	inst = ones_hashes(p, pos);
    	n_ones = inst[0];
    	n_hashes = inst[1];
    	new_pos = inst[2];
    	
    	if (n_ones==0 || n_hashes==0) {
    	    break;
    	}
    	
    	parsed.push([n_ones, n_hashes]);
    	pos = new_pos;
    }
    
    return [pos, parsed];
};

//
// split one command takes a 1# string and peels the first 1# command off the
// front, returning the command and the rest of the string
//
var split_one_command = function(onesharp_text) {
    var index = 0;
    var n_ones = 0;
    var n_hashes = 0;

    while (index < onesharp_text.length && onesharp_text[index]=='1') {
        n_ones++;
        index++;
    }
    while (index < onesharp_text.length && onesharp_text[index]=='#' && n_hashes < 5) {
        n_hashes++;
        index++;
    }
    remaining_text = onesharp_text.substring(index);

    return [[n_ones, n_hashes], remaining_text];
};

//
// The vernacular parser takes a piece of vernacular
// code and produces a list of (command, [arguments]) pairs
//
var vernacular_parse = function (vernacular_text) {
    var lines = vernacular_text.split("\n");
    var num_lines = lines.length;
    var ret = [];

    for (var i = 0; i < num_lines; i++) {
        // removes comments and trims the end of the line
        var line = lines[i].split(';')[0].trim();

        // peel all the 1# commands out of the line
        while (line[0] == '1') {
            var split_cmd = split_one_command(line);
            line = split_cmd[1].trim();
            ret.push(split_cmd[0])
        }
        
        tokens = line.split(/\s+/);
        if (tokens.length > 1) {
            if (tokens[0] == 'eval') {
                ret.push(['eval', tokens.slice(1)]);
            }
            else if (tokens[0] == 'import') {
                ret.push(['import', tokens[1]]);
            }
            else if (tokens[0] == 'label') {
                ret.push(['label', tokens[1]]);
            }
            else if (tokens[0] == 'goto') {
                ret.push(['goto', tokens[1]]);
            }
        }
    }
    return ret;
};


//
// Module testing
//

var test_battery_vernacular_parse = function() {
    console.log("Testing vernacular parsing...");

    test_vernacular_parse("Base 1#", "1#1##", [[1, 1], [1, 2]]);
    test_vernacular_parse("Eval", "eval a b c", [['eval', ['a', 'b', 'c']]]);
    test_vernacular_parse("Goto", "goto start", [['goto', 'start']]);
    test_vernacular_parse("Label", "label start", [['label', 'start']]);
};


var test_vernacular_parse = function (test_name, test_input, expected_result) {
    var actual = vernacular_parse(test_input);
    if (array_equality(expected_result, actual)) {
        console.log(test_name + " test: passed.");
    }
    else {
        console.log(test_name + " test: failed.");
    }
};


var array_equality = function(array1, array2) {
    if (array1 === array2) return true;
    if (array1 == null || array2 == null) return false;
    if (array1.length != array2.length) return false;

    for (var i = 0; i < array1.length; i++) {
        if (array1[i] instanceof Array && array2[i] instanceof Array) {
            if (!array_equality(array1[i], array2[i])) return false;
        }
        else {
            if (array1[i] != array2[i]) return false;
        }
    }
    return true;
};