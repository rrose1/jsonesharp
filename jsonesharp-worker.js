self.onmessage = function(e) {

    //
    // 1# interpreter
    //
    var extend_regs = function(regs, n) {

	var m = regs.length;

	while (m <= n) {
	    regs.push('');
	    m++;
	}

	return regs;
    };

    var ones_hashes = function(p, pos) {

	if (pos==p.length) {
	    return [0, 0, pos];
	};
    
	var n_ones = p[pos][0];
	var n_hashes = p[pos][1];
	pos++;
    
	return [n_ones, n_hashes, pos];
    };

    var transfer = function(p, pos, n, backward) {

	var new_pos = pos;
    
	if (backward) {
	    new_pos = pos - n;
	    if (new_pos < 0) {
		return pos;
	    }
	    return new_pos;
	}

	new_pos = pos + n;
	if (new_pos > p.length) {
	    return pos;
	}
	return new_pos;    
    };

    var cases = function(p, pos, n, regs) {

	var new_pos = pos;

	// add registers as needed
	if (regs.length <= n) {
	    regs = extend_regs(regs, n);
	}
	
	var data = regs[n];
	var i = data.search(/[1#]/);
	
	if (i==-1) {
	    new_pos = transfer(p, pos, 1);
	}
	else {
	    if (data[i]=='1') {
		new_pos = transfer(p, pos, 2);
	    }
	    else {
		new_pos = transfer(p, pos, 3);
	    }
	}
	if (new_pos != pos) {
	    // pop left
	    if (i==-1) {
		regs[n] = '';
	    }
	    else {
		regs[n] = data.slice(i+1);
	    }
	}

	return [new_pos, regs];
    };

    var append = function(c, n, regs) {

	// add registers as needed
	if (regs.length <= n) {
	    regs = extend_regs(regs, n);
	}
	
	regs[n] = regs[n].concat(c);

	return regs;
    };


    var step = function(p, pos, regs) {
    
	var inst = ones_hashes(p, pos);
	var n_ones = inst[0];
	var n_hashes = inst[1];
	var new_pos = inst[2];

	if (n_ones==0 || n_hashes==0) {
	    new_pos = pos;
	}
	else if (n_hashes==1) {
	    regs = append('1', n_ones, regs);
	}
	else if (n_hashes==2) {
	    regs = append('#', n_ones, regs);
	}
	else if (n_hashes==3) {
	    new_pos = transfer(p, pos, n_ones, false);
	}
	else if (n_hashes==4) {
	    new_pos = transfer(p, pos, n_ones, true);
	}
	else {
	    out = cases(p, pos, n_ones, regs);
	    new_pos = out[0];
	    regs = out[1];
	}
	return [new_pos, regs];
    };  
    
    //
    // evaluation loop
    //
    var p = e.data[0];
    var regs = e.data[1];

    var pos = 0;
    var new_pos = 0;
    
    var out = [new_pos, regs];
    
    while (true) {
        out = step(p, pos, regs);
	new_pos = out[0];
	regs = out[1];
        if (new_pos==pos) {
            break;
    	}
    	pos = new_pos;
    }

    self.postMessage([pos, regs]);

    self.close();
};
