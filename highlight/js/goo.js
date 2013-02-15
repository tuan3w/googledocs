var goo = {
	version: "0.0.1",
	author: "TuanZendF"
};

goo.Initialize = function(container,width, height){

	//create canvas div
	goo.cv = document.createElement('canvas');
	goo.privCanvas = document.createElement('canvas');

	if (width && height && typeof width == 'number' && typeof height == 'number' ){
		goo.privCanvas.width = goo.cv.width = width;
		goo.privCanvas.height = goo.cv.height = height;
	}
	else {
		goo.privCanvas.width = goo.cv.width = 400 ;
		goo.privCanvas.height = goo.cv.height = 300;
	}
	goo.privCanvas.style.position = goo.cv.style.position = 'absolute';
	goo.privCanvas.style.display = 'none';


	goo.hlContainer = document.createElement('div');
	goo.hlContainer.style.width = 0;
	goo.hlContainer.style.height = 0;
	goo.hlContainer.style.position = 'absolute';
	goo.hlContainer.style.zIndex = "100";
	var parrent = document.getElementById(container);
	parrent.appendChild(goo.cv);
	parrent.appendChild(goo.privCanvas);
	parrent.appendChild(goo.hlContainer);
	goo.container = parrent;
	goo.ct = goo.cv.getContext('2d');
	goo.privContext = goo.privCanvas.getContext('2d');
};
goo.setSize = function(w, h){
	goo.container.style.width = goo.privCanvas.style.width = goo.cv.style.width = w + 'px';
	goo.container.style.height = goo.privCanvas.style.height = goo.cv.style.height = h + 'px';
}
/*
 * goo.Bitmap
 *
 */
goo.Bitmap = function(img){
	var that = this;

	var tContext = goo.privContext;
	var tCanvas = goo.privCanvas;
	goo.setSize(img.width, img.height);
	//get image data
	tContext.drawImage(img, 0, 0)
	var tempData = tContext.getImageData(0,0,img.width,img.height).data;
	that.data = Matrix.create(img.height, img.width);
	that.width = img.width;
	that.height = img.height;

	that.histGram = new Array(256);
	for (var i=0; i< 256; i++)
		that.histGram[i] = 0;
	var index = 0;

	for (var i=0; i< img.height; i++){
		for (var j=0; j< img.width; j++){
			that.data[i][j] = Math.floor(tempData[index] * 0.2 + tempData[index + 1] * 0.72 + 0.08 * tempData[index+2]);
			index += 4;
		}
	}
	//this.makeHistogram();
	this.toBinary(150);
	this.calcTextRange();
	
};
var Bitmap_proto = goo.Bitmap.prototype;
/**
 * Draw Bitmap data
 */
Bitmap_proto.draw = function(x,y){
	var img = goo.ct.createImageData(this.width, this.height);
	var imgData = img.data;
	var index = 0;
	for (var i=0; i< this.height; i ++){
		for (var j=0; j< this.width; j++){
			imgData[index + 2] = imgData[index + 1]= imgData[index] = this.data[i][j];
			imgData[index + 3] = 255;
			index+=4;
		}
	}
	if (x &&  y )
		goo.ct.putImageData(img, x, y);
	else
		goo.ct.putImageData(img, 0, 0);
	//goo.ct.strokeRect(this.left, this.top, this.right - this.left + 1, this.bottom - this.top +1 );
	return this;
};
/**
 * Add highlight tool
 */
Bitmap_proto.addTool = function(){
	this.tool = new goo.Tool(this);
}
/**
 * Inverse transform
 */
Bitmap_proto.inverse = function(){
	for (var i=0; i< this.height; i++){
		for (var j=0; j<this.width; j++){
			this.data[i][j] = 255 - this.data[i][j];
		}
	}
}
/**
 * Normalized transform
 */
Bitmap_proto.normalize = function() {
    var min = 255;
    var max = 0;
    for (var i = 0; i < this.height; i++) {
        for (var j = 0; j < this.width; j++) {
            if (this.data[i][j] < min) {
                min = this.data[i][j];
                //  alert(min);
            }
            if (this.data[i][j] > max)
                max = this.data[i][j];
        }
    }
    var range = max - min;
    if (range == 255) //normalized
        return;
    for (var i = 0; i < this.height; i++) {
        for (var j = 0; j < this.width; j++) {
            this.data[i][j] = Math.floor(255 * 1.0 * (this.data[i][j] - min) / range);
        }
    }
};
/**
 * History gram
 */
Bitmap_proto.makeHistogram = function(){
	var data = this.data;
	for (var i=0; i< this.height; i++){
		for (var j=0; j< this.width; j++){
			this.histGram[data[i][j]]++;		
		}
	} 
	for (var i=0; i< 256; i++){
		this.histGram[i] /= (this.width * this.height);
	}
	return this.histGram;
	
}
Bitmap_proto.histEqualize = function(){
	this.makeHistogram();
	var fixGray = new Array(256);
	fixGray[0] =0;
	for (var i=1; i< 256; i++){
		fixGray[i] = Math.floor(fixGray[i-1] + this.histGram[i] * i);
		
	}

	//fix gray
	for (var i=0; i< this.height; i++){
		for (var j=0; j< this.width; j++){
			this.data[i][j] = fixGray[this.data[i][j]];		
		}
	} 
}
/**
 * convert to binary Image
 */
Bitmap_proto.toBinary = function(threshold) {
    //alert('binary');
    if (threshold) { //has threshold parameters
        for (var i = 0; i < this.height; i++) {
            for (var j = 0; j < this.width; j++) {
		//alert(this.data + "is" );
                if (this.data[i][j] < threshold)
                    this.data[i][j] = 0;
                else
                    this.data[i][j] = 255;
            }
        }
    } else {
	//alert('local')
        //use local threshold algorithm
        //local size : 5x5
        for (var x = 0; x < this.height - 5; x += 5) {
            for (var y = 0; y < this.width - 5; y += 5) {
                threshold_constrast = 10;

                var min = 256, max = -1;
                for (var i = x; i < x + 5; i++) {
                    for (var j = y; j < y + 5; j++) {
                        if (this.data[i][j] < min)
                            min = this.data[i][j];
                        if (this.data[i][j] > max)
                            max = this.data[i][j];

                    }
                }
                var local_constrast = max - min;
                var mid_gray = (max + min) / 2;

                if (local_constrast < threshold_constrast) {
                    if (mid_gray < 50)//foreground
                        for (var i = x; i < x + 5; i++) {
                            for (var j = y; j < y + 5; j++) {
                                this.data[i][j] = 0;
                            }
                        }
                    else
                        for (var i = x; i < x + 5; i++) {
                            for (var j = y; j < y + 5; j++) {
                                this.data[i][j] = 255;
                            }
                        }
                } else {
                    for (var i = x; i < x + 5; i++) {
                        for (var j = y; j < y + 5; j++) {
                            if (this.data[i][j] < mid_gray) {
                                this.data[i][j] = 0;
                            } else {
                                this.data[i][j] = 255;
                            }
                        }
                    }
                }

            }
        }
    }
};
Bitmap_proto.calcTextRange = function(){
	this.left = 0;
	this.right = this.width - 1;
	this.top = 0;
	this.bottom = this.height - 1;

	var isEdge = false;
	var count = 0;

	//find left border
	while (!isEdge){
		count = 0;
		for (var i=0; i< this.height; i++)
			if (this.data[i][this.left] == 0)
				count ++;

		if (count > 10){ //number of black points is larger than 10 points
			isEdge = true;
		}
		else
			this.left ++;
	}
	//find right border
	isEdge = false;
	while (!isEdge){
		count = 0;
		for (var i=0; i< this.height; i++)
			if (this.data[i][this.right] == 0)
				count ++;

		if (count > 10){ //number of black points is larger than 10 points
			isEdge = true;
		}
		else
			this.right--;
	}
	//find top border
	isEdge = false;
	while (!isEdge){
		count = 0;
		for (var i=0; i< this.width; i++)
			if (this.data[this.top][i] == 0)
				count ++;

		if (count > 10){ //number of black points is larger than 10 points
			isEdge = true;
		}
		else
			this.top++;
	}

	//find bottom border
	isEdge = false; 
	while (!isEdge){
		count = 0;
		for (var i=0; i< this.width; i++)
			if (this.data[this.bottom][i] == 0)
				count ++;

		if (count > 10){ //number of black points is larger than 10 points
			isEdge = true;
		}
		else
			this.bottom--;
	}
	console.log('top : ' + this.top + ',botom : ' + this.bottom + ', right: ' + this.right + ',left: ' + this.left);
};
/**
 * Highlight tool 
 *
 */
goo.Tool = function(bitmap){
	this.bitmap = bitmap;
	this.hlSet = []; //highlight containers

	var that = this;
	var p1, p2;
	var scrollLeft = window.pageXOffset ? window.pageXOffset : document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft;
	var scrollTop = window.pageYOffset ? window.pageYOffset : document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop;

	var x, y;
	var isMousedown = false;
	function getMousePos(e){
		x = e.clientX - goo.cv.parentNode.offsetLeft + scrollLeft;
		y = e.clientY - goo.cv.parentNode.offsetTop + scrollTop;
	}
	goo.container.addEventListener("mouseup", handler,false);
	goo.container.addEventListener("mousedown", handler,false);
	goo.container.addEventListener("mousemove", handler,false);

	function handler(e){	
		//console.log(x + "," + y);
		switch (e.type){
			case "mousedown":
				//alert('mouse down')
				isMousedown = true;
				goo.UnHighLight(); // un highlight
				//alert(x);
				getMousePos(e);
				p1 = new Point(x,y);
				break;
			case "mousemove":
				if (isMousedown) {
					console.log("mouse is move")
					getMousePos(e);
					p2 = new Point(x,y);
					if ( p1.y < p2.y)
						that.process(p1, p2);
					else
						that.process(p2, p1);
				}
				break;
			case "mouseup":
				isMousedown = false;
				//alert('mouse up')
				
				break;
		}
	}
}
var tool_proto = goo.Tool.prototype;
/**
 * Get highlight set
 */
tool_proto.getHighLightSet = function(){
	return this.hlSet;
}
/**
 * hihlight paragraph bound by 2 points
 * 
 */
tool_proto.process = function(p1, p2){
	console.log('highlight')
	var that = this;
	//remove history highlight
	goo.hlContainer.innerHTML = "";
	var bitmap = that.bitmap.data;
	var left = that.bitmap.left;
	var right = that.bitmap.right;
	var top = that.bitmap.top;
	var bottom = that.bitmap.bottom;
	
	//alert(p1.x + ',' + p2.x)

	//not process if out of text range
	if ((p1.x < that.bitmap.left && p2.x < that.bitmap.left )||
		(p1.x > that.bitmap.right && p2.x > that.bitmap.right)||
		( p2.y < that.bitmap.top)||
		(p1.y > this.bitmap.bottom))
		return;
	

	//check line is empty
	function isEmptyLine(y){
		var blackPoints = 0;
		for (var i= right; i>= left; i--)
			if (bitmap[y][i] == 0) {
				blackPoints ++;
				if (blackPoints > 1) //number of black points is larger than 6 (in row)
					return false;
			}
			return true;
	}

	//check collumn is empty
	// x : x-coordinate
	// y1,y2 : y-coordinate
	function isEmptyCol(x,y1,y2){
		for (var i = y1; i<= y2; i++)
			if (bitmap[i][x] == 0) 
				return false;

		return true;
	}
	// find nextEmptyline
	// y {number} y-coordinate
	function findNextEmptyLine(y){
		y++;
		if (y > bottom)
			return y;
		if (isEmptyLine(y))
			while ( y<= bottom && isEmptyLine(y)) y++;
		else {
			while ( y<= bottom && !isEmptyLine(y)) y++;
			y--;
		}
		return y;
	}
	function findEmptyCol(x,y1,y2,dir){
		if ( dir == 0) {
			if (isEmptyCol(x,y1,y2)) {
				x++;
				while (isEmptyCol(x,y1,y2) && x <= right) x++;
			}else {
				x --;
				while (!isEmptyCol(x-1,y1,y2) && x >= left) x--;
			}
		}else {
			if (isEmptyCol(x,y1,y2)) {
				x--;
				while (isEmptyCol(x,y1,y2) && x >= left) x--;
			}else {
				x ++;
				while (!isEmptyCol(x+1,y1,y2) && x <= right) x++;
			}
		}
		return x;
	}
	//get line of point
	// p {Point}

	var y1,y2,x1,x2;
	//find top-line 
	y1 = p1.y;
	that.hlSet = [];
	if ( y1 < top)
		y1 = top;
	else 
	if (isEmptyLine(y1))  //move down
		while (isEmptyLine(y1)) y1 ++;
	else  // move up
		while (!isEmptyLine(y1)) y1 --;

	//find bottom-line
	var yB = p2.y;
	if (yB > bottom)
		yB = bottom + 1;
	else if (isEmptyLine(yB)){
		while (isEmptyLine(yB) ) yB--;
		while (!isEmptyLine(yB)) yB --;
		yB++;
	}else {
		while (!isEmptyLine(yB)) yB --;
		yB++;
		isBottomLine = false;
	}	
	
	if (yB == y1) {  //same line
		//alert('same line');
		y2 = findNextEmptyLine(y1);
		x1 = p1.x < p2.x ? p1.x : p2.x;
		x2 = p1.x + p2.x - x1;
		
		console.log(p2.x - p1.x)
		if ( p1.x < left)
			x1= findEmptyCol(left,y1,y2,0);
		else
			x1 = findEmptyCol(x1,y1,y2,0);
		if (p2.x > right)
			x2 = findEmptyCol(right,y1,y2,1);
		else
			x2 = findEmptyCol(x2,y1,y2,1);

		if (x1 < x2 ){
			var o = {x: x1, y: y1, w: x2 -x1 +1, h: y2 - y1 + 1};
			that.hlSet.push(o);
		}
		goo.Highlight(that.hlSet);	  
		return;
	}
	else {  //not in same line

		//add top line
		y2 = findNextEmptyLine(y1);
		if ( p1.x < left)
			x1= findEmptyCol(left,y1,y2,0);
		else
			x1 = findEmptyCol(p1.x,y1,y2,0);
		x2 = findEmptyCol(right,y1,y2,1);
		if (x1 < x2) {
			var o = {x: x1, y: y1, w: x2 -x1 +1, h: y2 - y1 + 1};
			that.hlSet.push(o);
		}

		y1 = findNextEmptyLine(y2);
		y2 = findNextEmptyLine(y1);
		//add next full-length line
		while (y1 < yB) {		
			x1 = findEmptyCol(left, y1, y2, 0);
			x2 = findEmptyCol(right, y1, y2, 1);
			var o = {x: x1, y: y1, w: x2 -x1 +1, h: y2 - y1 + 1};
			that.hlSet.push(o);
			y1 = findNextEmptyLine(y2);
			y2 = findNextEmptyLine(y1);
		
		}
		
		//add last line
		y2 = findNextEmptyLine(y1);
		x1 = findEmptyCol(left, y1, y2, 0);

		x2 = p2.x;
		if (x2 > right)
			x2 = findEmptyCol(right, y1, y2, 1);
		else
			x2 = findEmptyCol(x2, y1, y2,1);
		if ( x1 < x2 ){
			var o = {x: x1, y: y1, w: x2 -x1 +1, h: y2 - y1 + 1};
			that.hlSet.push(o);
		}
		goo.Highlight(that.hlSet);   //highlight
	
	}
};
/**
 * goo.HighLight
 * o {object} o.x : left coordinate
 *			  o.y : top y coordinate
 * 			  o.w : width of rectangle
 * 			  o.h : height of rectangle
 */
goo.Highlight = function(set){
	//console.log('highlight');
	goo.UnHighLight();
	for (var i=0; i< set.length; i++){
		var o = set[i];
		var ele = document.createElement('div');
		ele.className="highlight";
		ele.style.height = o.h + "px";
		ele.style.left = o.x + "px";
		ele.style.top = o.y + "px" ;
		ele.style.width = o.w + 'px';
		
		goo.hlContainer.appendChild(ele);
	}
	
	
}
/**
 * goo.UnHighLight
 */
goo.UnHighLight = function(){
	goo.hlContainer.innerHTML = "";
}
