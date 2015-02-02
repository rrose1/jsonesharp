importScripts('interpreter.js');

self.onmessage = function(e) {

    var p = e.data[0];
    var regs = e.data[1];
    var t = e.data[2];
    var pos = 0;
    var new_pos = 0;

    var eval_loop = setInterval(function() {
        new_pos = step(p, pos, regs);
	if (new_pos==pos) {
	    clearInterval(eval_loop);
	    self.postMessage([pos, regs, true]);
	    self.close();
	}
	self.postMessage([pos, regs, false]);
	pos = new_pos;
    }, t);
};
