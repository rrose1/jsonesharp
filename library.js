var _SAVED_PROGRAMS_COOKIE = 'os-saved-programs';

//
// Library: dictionary with program title as key
//                          [vernac, 1#] texts as keys
// 

var is_pure_onesharp = function(vernacular_text) {
	return vernacular_text.match(/^[1#\s]*$/) != null;
}

var find_mentions = function(vernacular_text) {
	var ret = [];
	var parsed = vernacular_parse(vernacular_text);
	for (var i = 0; i < parsed.length; i++) {
		cmd = parsed[i];
		if (cmd[0] == 'eval') {
			for (var j = 0; j < cmd[1].length; j++) {
				if (!is_pure_onesharp(cmd[1][j])) {
					ret.push(cmd[1][j]);
				}
			}
		}
		else if (cmd[0] == 'import' && !is_pure_onesharp(cmd[1])) {
			ret.push(cmd[1]);
		}
	}
	return ret;
}

//
// Get all program titles in the library
//
var get_titles = function() {
	if ($.cookie(_SAVED_PROGRAMS_COOKIE)) {
		var saved_programs = JSON.parse($.cookie(_SAVED_PROGRAMS_COOKIE));
		return Object.keys(saved_programs);
	}
	else return [];
}

//
// Get the [vernacular, onesharp] representations of the title program.
//
var get_program = function(title) {
	if ($.cookie(_SAVED_PROGRAMS_COOKIE)) {
		var saved_programs = JSON.parse($.cookie(_SAVED_PROGRAMS_COOKIE));
		return saved_programs[title];
	}
	else return null;
}

var get_vernacular = function(title) {
	var program = get_program(title);
	if (program) return program[0];
	else return null;
}

var get_onesharp = function(title) {
	var program = get_program(title);
	if (program) return program[1];
	else return null;
}

//
// Local cycle detect looks for dependencies in the vernacular code of stored 
// programs in the library starting from the given node. 
// It returns [true, ok_nodes] if no cycle was found.
// (The ok nodes are the fragment of the library that was discovered.)
// It returns [false, cycle_path] if a cycle was found.
// (The cycle path doesn't necessarily start with the loop.)
//
var local_cycle_detect = function(current_node, previous_nodes, ok_nodes) {
	var children = find_mentions(get_vernacular(current_node));

	// Check all the children for cycles.
	for (var i = 0; i < children.length; i++) {
		// If the child has been cleared, skip it.
		if ($.inArray(children[i], ok_nodes) == -1) {
			// If the child was found previously, we have a cycle.
			if ($.inArray(children[i], previous_nodes) != -1) {
				previous_nodes.push(current_node);
				previous_nodes.push(children[i]);
				return [false, previous_nodes];
			}
			// If the child wasn't found, we have to check it for cycles.
			else {
				previous_nodes.push(current_node);
				var child_result = local_cycle_detect(children[i], previous_nodes, ok_nodes);
				if (!child_result[0]) return child_result;
			}
		}
	}
	ok_nodes.push(current_node);
	return [true, ok_nodes];
}

//
// Global cycle detection on the library.
//
var cycle_detect = function () {
	var nodes = get_titles();
	var cleared_nodes = [];

	while (nodes.length > 0) {
		var result = local_cycle_detect(nodes[0], [], cleared_nodes);
		if (result[0]) {
			cleared_nodes = result[1];
			for (var i = 0; i < nodes.length; i++) {
				var index = $.inArray(nodes[i], cleared_nodes);
				if (index != -1) {
					nodes.splice(i, 1);
					i--;
				}
			}
		}
		else return result;
	}
	return [true, []];
}

//
// Save a program in the library. Will overwrite program if existant.
//
var sudo_set_program = function (title, vernacular_text) {
    if ($.cookie(_SAVED_PROGRAMS_COOKIE)) {
        var saved_programs = JSON.parse($.cookie(_SAVED_PROGRAMS_COOKIE));
    }
    else {
        var saved_programs = {};
    }

    if (is_pure_onesharp(vernacular_text)) {
    	saved_programs[title] = [vernacular_text, vernacular_text];
    }
    else {
    	// compile vernacular text and save it
    	saved_programs[title] = [vernacular_text, ""];
    }
    $.cookie(_SAVED_PROGRAMS_COOKIE, JSON.stringify(saved_programs), 365);
};
