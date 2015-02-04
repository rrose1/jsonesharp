//
// 1# interpreter
//

var extend_regs = function(regs, n) {
    
    var m = regs.length;
    
    while (m <= n) {
	regs.push([]);
	m++;
    }
};

var transfer = function(p, pos, n) {
    
    var new_pos = pos + n;

    return new_pos > p.length ? pos : new_pos;
};

var cases = function(p, pos, n, regs) {
	
    var c = '';
    var head = [];
    while (regs[n].length > 0 && c != '#' && c != '1') {
	
	// pops a comment from register
	if (c==';') {
	    while (regs[n].length > 0 && c != '\n'
		   && c != '\f' && c != '\r') {
		c = regs[n].shift();
	    }
	}
	
	c = regs[n].shift();
	head.push(c)
    }
    
    var new_pos = pos;
    if (c=='1') {
	new_pos = transfer(p, pos, 2);
    }
    else if (c=='#')  {
	new_pos = transfer(p, pos, 3);
    }
    else {
	new_pos = transfer(p, pos, 1);
    }
    
    // in case of failed transfer, do nothing
    if (new_pos==pos) {
	regs[n] = head.concat(regs[n]);
    }
    
    return new_pos;
};

var step = function(p, pos, regs) {

    if (pos==p.length) {
	return pos;
    }

    var n_ones = p[pos][0];
    var n_hashes = p[pos][1];
    var new_pos = transfer(p, pos, 1);
    
    if (n_hashes==1) {
	extend_regs(regs, n_ones);
	regs[n_ones].push('1');
    }
    else if (n_hashes==2) {
	extend_regs(regs, n_ones);
	regs[n_ones].push('#');
    }
    else if (n_hashes==3) {
	new_pos = transfer(p, pos, n_ones);
    }
    else if (n_hashes==4) {
	new_pos = n_ones > pos ? pos : pos - n_ones;
    }
    else {
	extend_regs(regs, n_ones);
	new_pos = cases(p, pos, n_ones, regs);
    }
    return new_pos;
};  

var onesharp = function(p, regs) {

    var pos = -1;
    var new_pos = 0;

    while (new_pos != pos) {
	pos = new_pos;
        new_pos = step(p, pos, regs);
    }

    return pos;
};
