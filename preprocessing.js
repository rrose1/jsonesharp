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
// Vernacular compile replaces vernacular commands with equivalent 1# statements.
//
var vernacular_compile = function(vernacular_text) {
    var parsed = vernacular_parse(vernacular_text);

    // first pass takes import and eval statments and expands them.
    for (var i = 0; i < parsed.length; i++) {
        if (parsed[i][0] == 'import') {
            var program = get_onesharp(parsed[i][1]);

            var insert = vernacular_parse(program);
            var new_parsed = parsed.slice(0, i).concat(insert).concat(parsed.slice(i+1));
            parsed = new_parsed;
            i += insert.length - 1;
        }
        else if (parsed[i][0] == 'eval') {
            // first we have to possibly look up arguments in the library
            var arguments = [];
            for (var j = 0; j < parsed[i][1].length; j++) {
                if ($.inArray(parsed[i][1][j], get_titles()) != -1) {
                    var add = get_onesharp(parsed[i][1][j]);
                }
                else {
                    add = parsed[i][1][j];
                }
                if (j == 0) arguments.push(add);
                else arguments.push(add.split(''));
            }
            // then we run the program on its arguments
            program = vernacular_parse(arguments[0]);
            arguments[0] = "";
            var result = onesharp(program, arguments);
            var insert = vernacular_parse(arguments[1].join(''));
            var new_parsed = parsed.slice(0, i).concat(insert).concat(parsed.slice(i+1));
            parsed = new_parsed;
            i += insert.length - 1;
        }
    }
    // second pass removes label statements, recording the label's position in
    // a temporary dictionary.
    var label_dictionary = {};
    for (var i = 0; i < parsed.length; i++) {
        if (parsed[i][0] == 'label') {
            label_dictionary[parsed[i][1]] = i;
            parsed.splice(i, 1);
            i--;
        }
    }

    // third pass replaces goto statements with appropriate jump commands
    for (var i = 0; i < parsed.length; i++) {
        if (parsed[i][0] == 'goto') {
            if (label_dictionary.hasOwnProperty(parsed[i][1])) {
                var label_index = label_dictionary[parsed[i][1]];
                var offset = label_index - i;
                if (offset < 0) {
                    parsed[i][0] = -offset;
                    parsed[i][1] = 4;
                }
                else if (offset == 0) {
                    parsed[i][0] = 1;
                    parsed[i][1] = 4;
                }
                else {
                    parsed[i][0] = offset;
                    parsed[i][1] = 3;
                }
            }
            
        }
    }

    return parsed;
}

var parsed_to_string = function(parsed_output) {
    var ret = "";
    for (var i = 0; i < parsed_output.length; i++) {
        var cmd = parsed_output[i][0];
        if (cmd === parseInt(cmd, 10)) {
            ret += "1".repeat(cmd) + "#".repeat(parsed_output[i][1]) + " ";
        }
        else {
            if (ret[ret.length-1] == " ") ret += '\n';
            if (cmd == 'eval') {
                ret += 'eval ' + " ".join(parsed_output[i][1]) + '\n';
            }
            else if (cmd == 'import') {
                ret += 'import ' + parsed_output[i][1] + '\n';
            }
        }
    }
    return ret;
}


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

String.prototype.repeat = function(count) {
    if (count < 1) return '';
    var result = '', pattern = this.valueOf();
    while (count > 1) {
        if (count & 1) result += pattern;
        count >>= 1, pattern += pattern;
    }
    return result + pattern;
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