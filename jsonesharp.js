var _SAVED_PROGRAMS_COOKIE = 'os-saved-programs';

//
// status line
//

var status_text = function(text) {

    $('#status').text(text);
};

var halting_message = function(n, p) {

    //TODO: Look into more informative halting messages
    if (n==0 && p.length > 0) {
	   status_text('halted improperly');
    }
    else {
	   status_text('halted properly');
    }

};

var eval_message = function() {

    status_text('evaluating program');
};

var interrupt_message = function() {

    status_text('evaluation interrupted');
};

//
// DOM register management routines
//

var resize_text_area = function(e) {

    e.css('height', 'auto');
    var h = (e.prop('scrollHeight') + 2).toString().concat('px');
    e.css('height', h);
};

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
    textarea.attr('tabindex', n + 1);
    
    var label = $('<label>');
    label.attr('class', 'control_label col-sm-1');
    label.attr('for', id);
    label.html('R'.concat(n.toString()));

    var button = $('<button>');
    button.attr('type', 'button');
    button.attr('class', 'btn btn-default clear_register');
    button.html('clear');
    button.click(function () {
	var e = $('#'.concat(id)); 
	e.val('');
	resize_text_area(e);
    });
    
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
};

var extend_registers = function(n) {

    var m = $('.register').length + 1;

    while (m <= n) {
    	$('#rm').append(new_register(m));
    	m++;
    }

    update_register_buttons(m);
};

var add_one_register = function() {

    extend_registers($('.register').length + 1);
};

var remove_last_register = function() {

    var m = $('.register').length;

    if (m > 1) {
	var sel = '#'.concat('form_group_register_'.concat(m.toString()));
	$(sel).remove();
	update_register_buttons(m);
    }
};

//
// functions for copying registers stored in an array (starting at
// index 1) to DOM and back.
//

var dom_regs_to_array = function() {

    var dom_regs = $('.register')
    var regs = [[]];

    var id = '';
    var i = 0;
    while (i < dom_regs.length) {
    	id = '#register_'.concat((i+1).toString());
    	regs.push($(id).val().split(''));
    	i++;
    }
    
    return regs;
};

var array_to_dom_regs = function(regs) {

    var m = $('.registers').length
    
    if (regs.length < m) {
    	while (regs.length < m) {
    	    remove_last_register();
    	    m--;
    	}
    }
    else {
	   extend_registers(regs.length-1);
    }

    var id = '';
    var i = 1;
    var h = 0;
    while (i < regs.length) {
	id = '#register_'.concat(i.toString()); 
	$(id).val(regs[i].join(''));
	resize_text_area($(id));
	i++;
    }
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

var parse_program = function() {

    var p = $('#program').val();
    p = clean(p);
    var parsed = parse(p);
    if (parsed[0] < p.length) {
    	status_text('syntax error');
    	eval_button_ready();
    	return [false, parsed[1]];
    }
    return [true, parsed[1]];
};

//
// Button events and states
//

var clear_program = function() {

    $('#program').val('')
};

var eval_button_ready = function() {

    $('#interrupt').prop('disabled', true);
    $('#interrupt').off('click');
    $('#evaluate').prop('disabled', false);
    $('#eval_slow').prop('disabled', false);
};

var eval_button_busy = function() {

    $('#interrupt').prop('disabled', false);
    $('#evaluate').prop('disabled', true);
    $('#eval_slow').prop('disabled', true);
};

var evaluate = function() {

    eval_button_busy();
    eval_message();
    
    // Parse program
    var parsed = parse_program();
    if (parsed[0]) {
    	var p = parsed[1];
    }
    else {
	   return;
    }

    // Move dom registers to array
    var regs = [[]];
    regs = dom_regs_to_array(regs);

    // Start worker and make kill button active
    var thread = new Worker('evaluate.js');
    $('#interrupt').click(function() {

    	thread.terminate();
    	interrupt_message();
    	eval_button_ready();
    });
    thread.onmessage = function(e) {

    	halting_message(e.data[0], p);
    	array_to_dom_regs(e.data[1]);
    	eval_button_ready();
    };
    thread.postMessage([p, regs]);
};

var eval_slow = function() {
    
    eval_button_busy();
    eval_message();
    
    // Parse program
    var parsed = parse_program();
    if (parsed[0]) {
    	var p = parsed[1];
    }
    else {
	   return;
    }

    // Move dom registers to array
    var regs = [[]];
    regs = dom_regs_to_array(regs);

    // Start worker and make kill button active
    var thread = new Worker('eval-slow.js');
    $('#interrupt').click(function() {

    	thread.terminate();
    	interrupt_message();
    	eval_button_ready();
    });
    thread.onmessage = function(e) {

    	if (e.data[2]) {
    	    halting_message(e.data[0], p);
    	    eval_button_ready();
    	}
    	array_to_dom_regs(e.data[1]);
    };
    thread.postMessage([p, regs, 20]);
};

var load_program = function() {
    var text = $(this).siblings("p.program-text").text().trim();
    $("#program").val(text);
    $("#editor-tab").click();
};

var add_workshop_page = function(title, program_text, active, tabpanel_id) {
    // find the workshop's stacked nav
    var ul = $("#" + tabpanel_id + " ul.nav-tabs");
    var num_page = ul.children().size() + 1;

    // find a title
    if (title == null) title = "program " + num_page.toString();
    var id = tabpanel_id + '-p' + num_page.toString();

    // format the program text
    program_text = program_text.replace(/(?:\r\n|\r|\n)/g, '\n<br>');
    program_text = program_text.replace(/#1/g, '# 1');

    // make a new li to add to the navigation
    var new_li = $('<li>');
    new_li.attr('role', 'presentation');
    if (active) new_li.attr('class', 'active');

    var new_tab = $('<a>');
    new_tab.attr('href', '#' + id);
    new_tab.attr('role', 'tab');
    new_tab.attr('data-toggle', 'tab');
    new_tab.text(title);

    new_li.append(new_tab);
    ul.append(new_li);

    // add a new div with the program text and a load button
    var tab_content = $("#" + tabpanel_id + " div.tab-content");

    var new_panel = $('<div>');
    new_panel.attr({'role': 'tabpanel', 'class': 'tab-pane', 'id': id});
    if (active) new_panel.attr('class', 'tab-pane active');

    var new_p = $('<p>');
    new_p.attr('class', 'program-text');
    new_p.html(program_text);
    new_panel.append(new_p);

    if (tabpanel_id == 'workshop') {
        var new_button = $('<a>');
        new_button.attr({'class': 'btn btn-primary wk-pload', 'type': 'button', 
            'role': 'button', 'data-toggle': 'tooltip', 'title': 'l'});
        new_button.text('load into editor');
        new_button.click(load_program);
        new_button.tooltip();
        new_panel.append(new_button);
    }
    else if (tabpanel_id == 'save-modal-panel') {
        var new_button = $('<a>');
        new_button.attr({'class': 'btn btn-primary save-over', 'type': 'button', 
            'role': 'button'});
        new_button.text('overwrite this');
        new_button.click(function () {
            var processed_text = $('#program').val();
            processed_text = processed_text.replace(/#1/g, '# 1');

            sudo_save_program(title, processed_text);
            clear_std_tabs();
            load_library_from_cookie();
            //$(this).siblings('p.program-text').html(processed_text);
            $('div.modal').modal('hide');
        });
        new_panel.append(new_button);
    }
    else if (tabpanel_id == 'open-modal-panel') {
        var new_button = $('<a>');
        new_button.attr({'class': 'btn btn-primary open', 'type': 'button', 
            'role': 'button'});
        new_button.text('open');
        new_button.click(function () {
            $('#program').val($(this).siblings('p.program-text').text());
            $('div.modal').modal('hide');
        });
        new_panel.append(new_button);
    }

    tab_content.append(new_panel);

    return title;
};

var sudo_save_program = function (title, program_text) {
    if ($.cookie(_SAVED_PROGRAMS_COOKIE)) {
        var saved_programs = JSON.parse($.cookie(_SAVED_PROGRAMS_COOKIE));
        saved_programs[title] = program_text;
    }
    else {
        saved_programs = {};
    }
    $.cookie(_SAVED_PROGRAMS_COOKIE, JSON.stringify(saved_programs), 365);
};

var replenish_std_lib = function() {
    sudo_save_program("clear 1", "; clear 1\n1##### 111### 11#### 111####");
    sudo_save_program("pop 1", "; pop 1\n1##### 1### 1###");
}

var save_as_new = function() {
    var title = null;
    var program_text = $('#program').val();
    title = add_workshop_page(title, program_text, false, "workshop");
    add_workshop_page(title, program_text, false, "save-modal-panel");
    add_workshop_page(title, program_text, false, "open-modal-panel");
    sudo_save_program(title, program_text);
};

var clear_tabs = function(tabpanel_id) {
    $("#" + tabpanel_id + " ul.nav-tabs").empty();
    $("#" + tabpanel_id + " div.tab-content").empty();
}

var clear_std_tabs = function() {
    clear_tabs('workshop');
    clear_tabs('save-modal-panel');
    clear_tabs('open-modal-panel');
}

var load_library_from_cookie = function () {
    replenish_std_lib();
    var saved_programs = JSON.parse($.cookie(_SAVED_PROGRAMS_COOKIE));
    if (!saved_programs) saved_programs = {};

    var first = true;
    for (var title in saved_programs) {
        if (saved_programs.hasOwnProperty(title)) {
            add_workshop_page(title, saved_programs[title], first, "workshop");
            add_workshop_page(title, saved_programs[title], first, "save-modal-panel");
            add_workshop_page(title, saved_programs[title], first, "open-modal-panel");
            first = false;
        }
    }
};

//
// main
//

$(document).ready(function() {
    // load cookie data
    load_library_from_cookie();

    // prep editor tab
    extend_registers(1);
    eval_button_ready();

    // click handlers
    $('#remove_register').click(remove_last_register);
    $('#add_register').click(add_one_register);
    $('#clear_program').click(clear_program);
    $('#evaluate').click(evaluate);
    $('#eval_slow').click(eval_slow);
    $('a.wk-pload').click(load_program);
    $('#save_as_new').click(function () {
        $('#save-modal').modal('show');
    });
    $('#open').click(function () {
        $('#open-modal').modal('show');
    });
    $('#save_new_btn').click( function() {
        sudo_save_program($('#save_new_title').val(), $('#program').val());
        clear_std_tabs();
        load_library_from_cookie();
        $('div.modal').modal('hide');
    });

    // keyboard inputs
    $('body').keypress(function(e) {
        if (e.keyCode == 27) {
            $('div.modal').modal('hide');
            $('*').blur();
        }

        // intercept other keyboard inputs only if not in a text area
        if (!$('input,textarea').is(':focus')) {
            if (e.which == 63) { // '?'
                $("#help-modal").modal('show');
            }

            // these shortcuts are available for editor tab only
            if ($("li[class=active] > #editor-tab").length) {
                if (e.which == 114) { // 'r'
                    $('#evaluate').click();
                }
                if (e.which == 115) { // 's'
                    $('#save-modal').modal('show');
                }
                if (e.which == 111) {
                    $('#open-modal').modal('show');
                }
                if (e.which == 99) { // 'c'
                    $('#clear_program').click();
                }
                if (e.which == 119) { // 'w'
                    $("#workshop-tab").click();
                }
            }

            // these shortcuts are available for workshop tab only
            if ($("li[class=active] > #workshop-tab").length) {
                if (e.which == 101) { // 'e'
                    $("#editor-tab").click();
                }
                if (e.which == 108) { // 'l'
                    $('#workshop div[class="tab-pane active"] a').click();
                }
            }
            
            
        }
        
    });

    
});
