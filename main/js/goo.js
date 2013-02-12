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
	goo.ct = goo.cv.getContext('2d');
	goo.privContext = goo.privCanvas.getContext('2d');
};
goo.setSize = function(w, h){
	goo.privCanvas.style.width = goo.cv.style.width = w;
	goo.privCanvas.style.height = goo.cv.style.height = h;
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
	this.toBinary(150);
	
};
var Bitmap_proto = goo.Bitmap.prototype;
/**
 * Draw Bitmap data
 */
Bitmap_proto.draw = function(x,y){

	if (x && y)
		(new goo.Image(this.data)).draw(x,y);
	else
		(new goo.Image(this.data)).draw(0,0);

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
                    this.data[i][j] =240;
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
/**
 *
 *
 */
goo.Tool = function(bitmap){
	this.bitmap = bitmap;
	goo.cv.addEventListener("mouseup", handler);
	goo.cv.addEventListener("mousedown", handler);
	goo.cv.addEventListener("mousemove", handler);

	var isMousedown = false;
	var that = this;
	var p1, p2;
	function handler(e){
		var x = e.clientX - goo.cv.parentNode.offsetLeft;
		var y = e.clientY - goo.cv.parentNode.offsetTop;
//		alert( goo.cv.offsetLeft)
		//console.log(x + "," + y);
		switch (e.type){
			case "mousedown":
				isMousedown = true;
				//alert(x);
				p1 = new Point(x,y);
				break;
			case "mousemove":
				if (isMousedown) {
					console.log("mouse is move")
					p2 = new Point(x,y);
					that.process(p1, p2);
				}
				break;
			case "mouseup":
				isMousedown = false;
				break;
		}
	}
}
var tool_proto = goo.Tool.prototype;
tool_proto.process = function(p1, p2){
	console.log('highlight')
	//remove history highlight
	goo.hlContainer.innerHTML = "";
	var bitmap = this.bitmap.data;
	//get line energy
	function isEmptyLine(y){
		var blackPoints = 0;
		for (var i= bitmap[y].length -1; i>=0; i--)
			if (bitmap[y][i] == 0) {
				blackPoints ++;
				if (blackPoints > 6)
					return false;
			}
			return true;
	}
	function isEmptyCol(x,y1,y2){
		for (var i = y1; i<= y2; i++)
			if (bitmap[i][x] == 0)
				return false;

		return true;
	}
	function getLineOfPoint(p){
		//alert(p.x)
		var y = p.y;
		var x = p.x;
		var found = false;
		var e;
		var o = {
			x : 0,
			y: 0,
			w: 0,
			h: 0
		};
		while (y>= 0 && !found ){
			e = isEmptyLine(y);
			if (e)
				found = true;
			else
				y --;
		}
		if (found)
			o.y = y;
		else
			o.y = 0;

		y = p.y;
		found = false;
		while (y  < bitmap.length && !found ){
			e = isEmptyLine(y);
			if ( e)
				found = true;
			else
				y ++;
		}
		if (found)
			o.h = y - o.y + 1;
		else
			o.h = bitmap.length - o.y;
		found = false;
		while (x >= 0 && !found){
			e = isEmptyCol(x, o.y, o.y + o.h);
			if (e)
				found = true;
			else
				x --;
		}
		if (found)
			o.x = x;
		else
			o.x = 0;
		//alert(o.x)
		o.w = bitmap[0].length - o.x;
		goo.Highlight(o);
		return o;
	}
	lineT = getLineOfPoint(p1);
}
/**
 * goo.HighLight
 *
 */
goo.Highlight = function(o){
	console.log('highlight');
	var ele = document.createElement('div');
	ele.className="highlight";
	ele.style.height = o.h + "px";
	ele.style.left = o.x + "px";
	ele.style.top = o.y + "px" ;
	ele.style.width = o.w + 'px';
	goo.hlContainer.appendChild(ele);
}
/**
 * goo.Image
 
 */
goo.Image = function(data){
	var ct = goo.ct;
	this.img = ct.createImageData(data[0].length, data.length);
	var index =0;
	var imgData = this.img.data;
	for (var i=0; i< data.length; i ++){
		for (var j=0; j< data[0].length; j++){
			imgData[index + 2] = imgData[index + 1]= imgData[index] = data[i][j];
			imgData[index + 3] = 255;
			index+=4;
		}
	}
	
};
var Image_proto = goo.Image.prototype;
Image_proto.draw = function(x,y){
	var ct = goo.ct;

	ct.putImageData(this.img, 0, 0);

	return this;
};
