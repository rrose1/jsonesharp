//
//
//

var clear_program = function() {

    $('#program').val('')

    return;
};


//
// Register management routines
//

var new_register = function(n) {

    var id = 'register_'.concat(n.toString());
    var grp_id = 'form_group_'.concat(id);
    
    var grp = $('<div>');
    grp.attr('class', 'form-group');
    grp.attr('id', grp_id);
    
    var col2 = $('<div>');
    col2.attr('class', 'col-sm-9');

    var col3 = $('<div>');
    col3.attr('class', 'col-sm-2');

    var textarea = $('<textarea>');
    textarea.attr('class', 'form-control register');
    textarea.attr('rows', '1');
    textarea.attr('id', id);
    
    var label = $('<label>');
    label.attr('class', 'control_label col-sm-1');
    label.attr('for', id);
    label.html('R'.concat(n.toString()));

    var button = $('<button>');
    button.attr('type', 'button');
    button.attr('class', 'btn btn-default clear_register');
    button.html('clear');
    button.click(function () { $( '#'.concat(id) ).val(''); });
    
    col2.append(textarea);
    col3.append(button);
    grp.append(label);
    grp.append(col2);
    grp.append(col3);

    return grp;
};

var update_register_buttons = function(m) {

    $('#add_register').html('add R'.concat(m.toString()));
    $('#remove_register').html('remove R'.concat((m-1).toString()));
    if (m==2) {
	// Disable remove register button when there's only one register
	$('#remove_register').prop("disabled", true);
    }
    else {
	$('#remove_register').prop("disabled", false);
    }

    return;
};

var extend_registers = function(n) {

    var m = $('.register').length + 1;

    while (m <= n) {
	$('#rm').append(new_register(m));
	m++;
    }

    update_register_buttons(m);

    return;
};

var add_one_register = function() {

    extend_registers($('.register').length + 1);

    return;
};

var remove_last_register = function() {

    var m = $('.register').length;

    if (m > 1) {
	var sel = '#'.concat('form_group_register_'.concat(m));
	$(sel).remove();
	update_register_buttons(m);
    }

    return;
};

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

//
// 1# intepreter
//

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

var ones_hashes_backward = function(p, pos) {

    var n_ones = 0
    var n_hashes = 0
    
    if (pos==0) {
        return [0, 0, 0];
    }
    
    pos--;

    while (p[pos]=='#' && n_hashes < 5) {
        n_hashes++;
        if (pos==0) {
            return [n_ones, n_hashes, pos];
	}
        pos--;
    }
    while (p[pos]=='1') {
        n_ones++;
        if (pos==0) {
            return [n_ones, n_hashes, pos];
	}
        pos--;
    }
    
    pos++;

    return [n_ones, n_hashes, pos]
};

var transfer = function(p, pos, n, backward) {
    
    var start = pos;
    var inst = [0,0,0];
    var n_ones = 0;
    var n_hashes = 0;
    
    while (n > 0) {
        if (backward) {
	    inst = ones_hashes_backward(p, pos);
	}
        else {
            inst = ones_hashes(p, pos);
	}
	
        n_ones = inst[0];
	n_hashes = inst[1];
	pos = inst[2];

        if (n_ones==0 || n_hashes==0) {
            pos = start;
            break;
	}
        n--;
    }
    return pos;
};

var cases = function(p, pos, n) {

    var new_pos = pos;
    var sel = '#register_'.concat(n.toString());
    var r = $(sel);

    // add registers as needed
    if (r.length==0) {
	extend_registers(n);
	r = $(sel);
    }

    var data = r.val();
    var i = data.search(/[1#]/);

    if (i==-1) {
	new_pos = transfer(p, pos, 1);
    }
    else {
	if (data.charAt(i)=='1') {
	    new_pos = transfer(p, pos, 2);
	}
	else {
	    new_pos = transfer(p, pos, 3);
	}
    }
    if (new_pos != pos) {
	// pop left
	if (i==-1) {
	    r.val('');
	}
	else {
	    r.val(r.val().slice(i+1));
	}
    }

    return new_pos;
};

var append = function(c, n) {

    var sel = '#register_'.concat(n.toString());
    var r = $(sel);

    // add registers as needed
    if (r.length==0) {
	extend_registers(n);
	r = $(sel);
    }

    r.val(r.val().concat(c));
};


var step = function(p, pos) {
    
    var inst = ones_hashes(p, pos);
    var n_ones = inst[0];
    var n_hashes = inst[1];
    var new_pos = inst[2];

    // console.log(inst);
    
    if (n_ones==0 || n_hashes==0) {
	return pos;
    }
    if (n_hashes==1) {
	append('1', n_ones);
	return new_pos;
    }
    if (n_hashes==2) {
	append('#', n_ones);
	return new_pos;
    }
    if (n_hashes==3) {
	return transfer(p, pos, n_ones, false);
    }
    if (n_hashes==4) {
	return transfer(p, pos, n_ones, true);
    }
    if (n_hashes==5) {
	return cases(p, pos, n_ones);
    }
};  

var eval_buttons_ready = function() {

    $('#interrupt').prop('disabled', true);
    $('#evaluate').prop('disabled', false);
    $('#evaluate_nonint').prop('disabled', false);
    return;
};

// This `evaluate`, though faster, cannot be interrupted (easily)
var evaluate_nonint = function() {

    var p = $('#program').val();
    var pos = 0;
    var new_pos = 0;
    
    p = clean(p);

    $('#interrupt').prop('disabled', true);
    $('#evaluate').prop('disabled', true);
    $('#evaluate_nonint').prop('disabled', true);

    while (true) {
        new_pos = step(p, pos);
        if (new_pos==pos) {
	    eval_buttons_ready();
            break;
	}
	pos = new_pos;
    }

    return;
};

var interrupt = function() {

    clearInterval(eval_interval);
    eval_buttons_ready();
    return;
};

var evaluate = function() {

    p = $('#program').val();
    pos = 0;
    new_pos = 0;
    
    p = clean(p);

    $('#interrupt').prop('disabled', false);
    $('#evaluate').prop('disabled', true);
    $('#evaluate_nonint').prop('disabled', true);
    
    eval_interval = setInterval( function() {
        new_pos = step(p, pos);
        if (new_pos==pos) {
	    interrupt()
	}
	pos = new_pos;
    }, 1);
    
    return;
};

$(document).ready(function() {

    eval_buttons_ready();
    extend_registers(1)
    
    $('#remove_register').click(remove_last_register)
    $('#add_register').click(add_one_register)
    $('#clear_program').click(clear_program);
    $('#evaluate').click(evaluate);
    $('#evaluate_nonint').click(evaluate_nonint);
    $('#interrupt').click(interrupt);
});
