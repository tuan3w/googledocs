var goo = {
	version: "0.0.1",
	author: "TuanZendF"
};
goo.config = { //config
	SAMPLEWIDTH : 8,
	SAMPLEHEIGHT : 14
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
//	goo.privCanvas.style.top = '200px';
	goo.privCanvas.style.zIndex = -1;
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
	goo.container.style.height = goo.privCanvas.style.height = goo.cv.style.height  =  h + 'px';
	goo.cv.width = goo.privCanvas.width = w;
	goo.cv.height = goo.privCanvas.height = h;
}
/*
 * goo.Bitmap
 *
 */
goo.Bitmap = function(img,fixSkew){
	var that = this;

	that.tool = null;

	var tContext = goo.privContext;
	var tCanvas = goo.privCanvas;
	goo.setSize(img.width, img.height);
	//get image data
	tContext.setTransform(1,0,0,1,0,0);
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
	this.toBinary();
	this.calcTextRange();

	if (fixSkew) {
		var angle = this.skewDetection();
		//alert(angle * 180 / Math.PI);
		tContext.rotate(-angle );
		tContext.fillStyle = '#fff';
		//	tContext.fillRect(0,0,img.width, img.height);
		tContext.drawImage(img,0,0);
		//alert('test')
		var tempData = tContext.getImageData(0,0,img.width,img.height).data;
		var index = 0;

		that.data =  Matrix.create(img.height, img.width);
		for (var i=0; i< img.height; i++){
			for (var j=0; j< img.width; j++){
				that.data[i][j] = Math.floor(tempData[index] * 0.2 + tempData[index + 1] * 0.72 + 0.08 * tempData[index+2]);
				index += 4;
			}
		}
		this.toBinary();
		this.calcTextRange();
			// this.skewCorection(angle);
			// this.calcTextRange();
	}
		
	//}
};
var Bitmap_proto = goo.Bitmap.prototype;
/**
 * Draw Bitmap data
 */
Bitmap_proto.draw = function(x,y){
	//goo.ct.clearRect(0,0,goo.ct.width, goo.ct.height);
	goo.drawImage(this.data, x, y);
};
/**
 * normalize input data
 * output size 14 x 10
 */
goo.Bitmap.extractFeature = function(input){
    var DOWNSAMPLE_HEIGHT = goo.config.SAMPLEHEIGHT ;
    var DOWNSAMPLE_WIDTH = goo.config.SAMPLEWIDTH;

    var width = input[0].length;
    var height = input.length;

  	//create feature matrix --> set indensity featuree
	var out = Matrix.create(DOWNSAMPLE_HEIGHT, DOWNSAMPLE_WIDTH);
 	var cellWidth= width / DOWNSAMPLE_WIDTH;
    var cellHeight = height/ DOWNSAMPLE_WIDTH;

    var gray;
    for(var row = 0, i= 0; row<DOWNSAMPLE_WIDTH; row++ )
    {
        for(var col = 0; col<DOWNSAMPLE_WIDTH; col++)
        {
            var x = Math.floor(cellHeight * row );
            var y =Math.floor(cellWidth * col);

            var maxX = x + cellHeight ;
            if (maxX >= height -1 )
            	maxX = height - 1;
            var maxY = y + cellWidth;
            if (maxY > width - 1)
            	maxY = width - 1;

            gray = 0;
            for (var i=x ; i <maxX; i++)
	            for(var j =y; j< maxY; j++)
	            {
	                if (input[i][j] == 0)
	                	gray ++;
	            }
            out[row][col] = (gray * 1.0 / (cellWidth * cellHeight) - 0.5) * 2;
        }
    }

    //sccaleDownImage
    var cellWidth= width / DOWNSAMPLE_WIDTH;
    var cellHeight = height/ DOWNSAMPLE_WIDTH;

    var sample = Matrix.create(DOWNSAMPLE_WIDTH, DOWNSAMPLE_WIDTH);
    Matrix.fill(sample,0);

    for(var row = 0, i= 0; row<DOWNSAMPLE_WIDTH; row++ )
    {
        for(var col = 0; col<DOWNSAMPLE_WIDTH; col++)
        {
            var x = Math.floor(cellHeight * row );
            var y =Math.floor(cellWidth * col);
            
            var d = false;

            // see if at least one pixel is "black"
            var maxX = x + cellHeight ;
            if (maxX >= height -1 )
            	maxX = height - 1;
            var maxY = y + cellWidth;
            if (maxY > width - 1)
            	maxY = width - 1;
            for (var i=x ; i <maxX; i++)
	            for(var j =y; j< maxY; j++)
	            {

	                if( input[i][j] == 0 ) 
	                {
	                    d = true;
	                    break;
	                }
	            }
            if( d ){
                sample[row][col] = 1;  //back point
            } else {
                sample[row][col] = 0;  //white point
            }
        }
    }

    //extract other feature
    for (var i=0; i< DOWNSAMPLE_WIDTH; i++) {

    	// //vertical an hotizontal projection
    	// var count = 0;
    	// for (var j=DOWNSAMPLE_WIDTH/2; j >= 0; j--) 
    	// 	count += sample[j][i];

    	// out[DOWNSAMPLE_WIDTH][i] = count * 2.0 / (DOWNSAMPLE_WIDTH);

    	// count = 0;
    	// for (var j=DOWNSAMPLE_WIDTH/2 + 1; j< DOWNSAMPLE_WIDTH; j++) 
    	// 	count += sample[j][i];
    	// out[DOWNSAMPLE_WIDTH + 1][i] = count * 2.0 / (DOWNSAMPLE_WIDTH);

    	count = 0;
    	for (var j=0; j< DOWNSAMPLE_WIDTH/2; j++)
    		count += sample[i][j];
    	out[DOWNSAMPLE_WIDTH + 4][i] = count * 2.0 / (DOWNSAMPLE_WIDTH);

    	count = 0;
    	for (var j=DOWNSAMPLE_WIDTH/2 + 1; j< DOWNSAMPLE_WIDTH; j++) 
    		count += sample[i][j];
    	out[DOWNSAMPLE_WIDTH + 5][i] = count * 2.0 / (DOWNSAMPLE_WIDTH);

    	//vertical and hotizontal profile
    	var j = 0;
    	while (j< DOWNSAMPLE_WIDTH && sample[i][j] == 0 ) j++;
    	out[DOWNSAMPLE_WIDTH][i] = j * 1.0 / DOWNSAMPLE_WIDTH ;
    	//alert(out[DOWNSAMPLE_WIDTH][i])

    	var j = DOWNSAMPLE_WIDTH - 1;
    	while (j>=0 && sample[i][j] == 0 ) j--;
    	out[DOWNSAMPLE_WIDTH + 1][i] = (DOWNSAMPLE_WIDTH - j) * 1.0 / DOWNSAMPLE_WIDTH;

		var j = 0;
    	while (j< DOWNSAMPLE_WIDTH && sample[j][i] == 0) j++;
    	out[DOWNSAMPLE_WIDTH + 2][i] = j * 1.0 / DOWNSAMPLE_WIDTH;

    	var j = DOWNSAMPLE_WIDTH - 1;
    	while (j>=0 && sample[j][i] == 0 ) j--;
    	out[DOWNSAMPLE_WIDTH + 3][i] = (DOWNSAMPLE_WIDTH - j) * 1.0 / DOWNSAMPLE_WIDTH;

    }
    delete sample;
  // alert(out)
    return out;
};
goo.drawImage = function(arr,x,y,isPrivContext) {

	var img = goo.ct.createImageData(arr[0].length, arr.length);
	var imgData = img.data;
	var index = 0;
	for (var i=0; i< arr.length; i ++){
		for (var j=0; j< arr[0].length; j++){
			imgData[index + 2] = imgData[index + 1]= imgData[index] = arr[i][j];
			imgData[index + 3] = 255;
			index+=4;
		}
	}
	var ct;
	if (isPrivContext)
		ct = goo.privContext;
	else
		ct = goo.ct;

	if (x &&  y )
		ct.putImageData(img, x, y);
	else
		ct.putImageData(img, 0, 0);
	//goo.ct.strokeRect(this.left, this.top, this.right - this.left + 1, this.bottom - this.top +1 );
	return this;
};
Bitmap_proto.getBitmap = function(o){
	var data = this.data;
	var tBitmap = Matrix.create(o.h + 1, o.w + 1);
	for (var i=0; i< o.h; i++){
		for (var j=0; j< o.w; j++){
			tBitmap[i][j] = data[o.y +i][o.x + j];
		}
	}
	return tBitmap;
};
/**
 * Add highlight tool
 */
Bitmap_proto.addHighlightTool = function(){
	this.tool = new goo.Tool(this);
};
Bitmap_proto.addOCRTool = function(tool){
	//this.OCRTool = tool;
};
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
	
};
/**
 * Check a line in image is empty
 */
Bitmap_proto.isEmptyLine = function(y,left,right){
	var data = this.data;
	var blackPoints = 0;
	if (!left && !right) {
		left = this.left;
		right = this.right;
	}

	for (var i= right; i>= left; i--)
		if (data[y][i] == 0) {
			blackPoints ++;
			if (blackPoints > 0) //number of black points is larger than 1 (in row)
				return false;
		}
	
	return true;
};

/**
 * Check a collumn in image is empty
 */
Bitmap_proto.isEmptyCol = function(x,y1,y2){
	var data = this.data;
	var count = 0;
	for (var i = y1; i<= y2; i++)
		if (data[i][x] == 0) {
			count ++;
			if (count > 0)
				return false;
		}
	
	return true;
};
/**
 * find nextEmptyline
 * y {number} y-coordinate
 */
Bitmap_proto.findNextEmptyLine = function(y){
	y++;
	if (y > this.bottom)
		return y;
	if ( this.isEmptyLine(y))
		while ( y <= this.bottom && this.isEmptyLine(y)) y++;
	else {
		while ( y <= this.bottom && ! this.isEmptyLine(y)) y++;
		y--;
	}
	return y;
};
Bitmap_proto.findNextCol = function(x, y1, y2, dir) {
	if (dir == 0 ){
		if (this.isEmptyCol(x,y1,y2)) {
			x++;
			while ((this.isEmptyCol(x,y1,y2)) && x <= this.right) x++;
			x --;
		}else {
			while (!this.isEmptyCol(x+1,y1,y2) &&  x <= this.right) x++;
		//	x --;
		}
	}
	else {
		if (this.isEmptyCol(x,y1,y2)) {
			x--;
			while (this.isEmptyCol(x,y1,y2) && x >= this.left) x--;
		}else {
			while (!this.isEmptyCol(x-1,y1,y2) && x  >= this.left) x--;
		}
	}
	return x;
}
/**
 * Skew Detection
 *
 */
Bitmap_proto.skewDetection = function() {

    //var PMAX =this.width * this.width + this.height * this.height;
    //var PMAX = PMAX * 5 +1;
    //test over 100 x 100
    var PMAX = 100 + 500 ;
    htable = Matrix.create(PMAX, 91);
   	Matrix.fill(htable, 0);
    // htable = new Array(this.width + this.height);
    // for (var i = 0; i < PMAX; i++) {
    //     htable[i] = new Array(181);
    //     for (var j = 0; j < htable[i].length; j++)
    //         htable[i][j] = 0;
    // }

    var max = 0;
    var angle = 0;
    var change = Math.PI / 180;
    for (var i = 0; i < 100; i++) {
        for (var j =0; j < 500; j++) {
            if (this.data[this.top + i ][this.left + j] == 0) {
                for (var a = 0; a < 45; a += 0.5) {
                    var temp = a * change;
                    p = Math.floor(i * Math.sin(temp) + j * Math.cos(temp));
                    htable[p][a * 2 ] += 1;
                    if (htable[p][a * 2 ] > max) {
                        max = htable[p][a * 2];
                        angle = a;
                    }
                }
            }
        }
    }

    delete htable;
    return angle * change;
};
Bitmap_proto.skewCorection = function(theta){
	var tmp = new Array(this.height);
    for (var i = 0; i < tmp.length; i++) {
        tmp[i] = new Array(this.width);
        for (var j = 0; j < tmp[i].length; j++)
            tmp[i][j] = 255;
    }

    for (var i = 0; i < this.height; i++) {
        for (var j = 0; j < this.width; j++) {
            var newX = Math.floor(Math.cos(theta) * j + Math.sin(theta) * i);
            var newY = Math.floor(-Math.sin(theta) * j + Math.cos(theta) * i);

            if (0 <= newX && newX < this.width && 0 <= newY && newY < this.height)
                tmp[newY][newX] = this.data[i][j];
        }
    }

    for (var i = 0; i < this.height; i++) {
        for (var j = 0; j < this.width; j++) {
            this.data[i][j] = tmp[i][j];
        }
    }

}
/**
 * Find next empty col follow a direction
 */
Bitmap_proto.findEmptyCol = function(x,y1,y2,dir){
	if ( dir == 0) {
		if (this.isEmptyCol(x,y1,y2)) {
			x++;
			while (this.isEmptyCol(x,y1,y2) && x <= this.right) x++;
		}else {
			x --;
			while (!this.isEmptyCol(x-1,y1,y2) && x >= this.left) x--;
			x++;
		}
	}else {
		if (this.isEmptyCol(x,y1,y2)) {
			x--;
			while (this.isEmptyCol(x,y1,y2) && x >= this.left) x--;
		}else {
			x ++;
			while (!this.isEmptyCol(x+1,y1,y2) && x <= this.right) x++;
			x --;
		}
	}
	return x;
};
/**
 * Histogram equalize
 */
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
};

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

		if (count > 0){ //number of black points is larger than 10 points
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

		if (count > 0){ //number of black points is larger than 10 points
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

		if (count > 0){ //number of black points is larger than 10 points
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

		if (count > 0){ //number of black points is larger than 10 points
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

	//var OCRTool = bitmap.OCRTool ? bitmap.OCRTool : undefined;

	//var hasClipboard = (OCRTool && OCRTool.clip) ? true : false;
	goo.container.addEventListener("mouseup", handler,false);
	goo.container.addEventListener("mousedown", handler,false);
	goo.container.addEventListener("mousemove", handler,false);
	function handler(e){	
		//console.log(x + "," + y);
		switch (e.type){
			case "mousedown":
				//alert('mouse down')
				isMousedown = true;
				
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
						that.separateLine(p1, p2);
					else
						that.separateLine(p2, p1);
					goo.Highlight(that.hlSet);

				}
				break;
			case "mouseup":
				isMousedown = false;
				//alert('mouse up')
				//if (OCRTool ) {    //recognition
					//alert('has tool')
				//	that.separateChar(true);
					//var data = that.getData();
					//alert(data.length);
					// OCRTool.recognize_actionPerformed(data);
					// //alert(OCRTool.getResult());
					// if (OCRTool.clip) {//has clipboard
					//  	OCRTool.clip.setText(OCRTool.getResult());
					// }
				//}
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
};
/**
 * hihlight paragraph bound by 2 points
 * 
 */
tool_proto.separateLine = function(p1, p2){
	console.log('highlight')
	var that = this;
	that.hlSet = [];
	//remove history highlight
	goo.hlContainer.innerHTML = "";
	var bitmap = that.bitmap;
	var left = bitmap.left;
	var right = bitmap.right;
	var top = bitmap.top;
	var bottom = bitmap.bottom
	
	//alert(p1.x + ',' + p2.x)

	//not separateLine if out of text range
	if ((p1.x < bitmap.left && p2.x < bitmap.left )||
		(p1.x > bitmap.right && p2.x > bitmap.right)||
		( p2.y < bitmap.top)||
		(p1.y > bitmap.bottom))
		return;
	

	

	var y1,y2,x1,x2;
	//find top-line 
	y1 = p1.y;
	if ( y1 < top)
		y1 = top;
	else 
	if (bitmap.isEmptyLine(y1))  //move down
		while (bitmap.isEmptyLine(y1)) y1 ++;
	else { // move up
		while (!bitmap.isEmptyLine(y1)) y1 --;
		y1 ++;
	}

	//find bottom-line
	var yB = p2.y;
	if (yB > bottom)
		yB = bottom;
	else if (bitmap.isEmptyLine(yB)){
		while (bitmap.isEmptyLine(yB) ) yB--;
		while (!bitmap.isEmptyLine(yB)) yB --;
		yB++;
	}else {
		while (!bitmap.isEmptyLine(yB)) yB --;
		yB++;
	}	
//	alert(yB + ', ' + y1)
	if (yB == y1) {  //same line
		//alert('same line');
		y2 = bitmap.findNextEmptyLine(y1);
		x1 = p1.x < p2.x ? p1.x : p2.x;
		x2 = p1.x + p2.x - x1;
		
		console.log(p2.x - p1.x)
		if ( p1.x < left)
			x1= bitmap.findEmptyCol(left,y1,y2,0);
		else
			x1 = bitmap.findEmptyCol(x1,y1,y2,0);
		if (p2.x > right)
			x2 = bitmap.findEmptyCol(right,y1,y2,1);
		else
			x2 = bitmap.findEmptyCol(x2,y1,y2,1);

		if (x1 < x2 ){
			var o = {x: x1, y: y1, w: x2 -x1 +1, h: y2 - y1 + 1};
			that.hlSet.push(o);
		}
		goo.Highlight(that.hlSet);	  
		return;
	}
	else {  //not in same line

		//add top line
		y2 = bitmap.findNextEmptyLine(y1);
		if ( p1.x < left)
			x1= bitmap.findEmptyCol(left,y1,y2,0);
		else
			x1 = bitmap.findEmptyCol(p1.x,y1,y2,0);
		x2 = bitmap.findEmptyCol(right,y1,y2,1);
		if (x1 < x2 && y2 - y1 >2) {
			var o = {x: x1, y: y1, w: x2 -x1 +1, h: y2 - y1 + 1};
			that.hlSet.push(o);
		}

		y1 = bitmap.findNextEmptyLine(y2 + 1);
		y2 = bitmap.findNextEmptyLine(y1);
		//add next full-length line
		while (y1 < yB) {		
			x1 = bitmap.findEmptyCol(left, y1, y2, 0);
			x2 = bitmap.findEmptyCol(right, y1, y2, 1);
			var o = {x: x1, y: y1, w: x2 -x1 +1, h: y2 - y1 + 1};
			that.hlSet.push(o);
			y1 = bitmap.findNextEmptyLine(y2 + 1);
			y2 = bitmap.findNextEmptyLine(y1 + 1);
		
		}
		
		//add last line
		y2 = bitmap.findNextEmptyLine(y1);
		x1 = bitmap.findEmptyCol(left, y1, y2, 0);

		x2 = p2.x;
		if (x2 > right)
			x2 = bitmap.findEmptyCol(right, y1, y2, 1);
		else
			x2 = bitmap.findEmptyCol(x2, y1, y2,1);
		if ( x1 < x2   && y2 - y1 >2){
			var o = {x: x1, y: y1, w: x2 -x1 +1, h: y2 - y1 + 1};
			that.hlSet.push(o);
		}
	//	goo.Highlight(that.hlSet);   //highlight
	
	}
};
/**
 * Seperate character
 */
tool_proto.separateChar = function(includeSpace){

	var totalSpace = 0;
	nSpace = 0;

	var hlSet = [];
	var bitmap = this.bitmap;
	var x1,x2, y1, y2,xR, yB;
	var n = 0;
	var startIndex = -1;
	var maxW = 0;
	for (var i =0,len = this.hlSet.length ; i < len; i++){
		var block = this.hlSet[i];
		x1 = block.x;
		xR = x2 = block.x + block.w -1;
		yB = y2 = block.y + block.h -1;
		startIndex = hlSet.length;
		while (x1 < xR) {

			y1 = block.y;

			y2 = block.y + block.h -1;
			x2 = bitmap.findNextCol(x1,y1,y2,0);
			//alert(bitmap.isEmptyCol(x1,y1,y2))
			//alert(x1 + ", " + x2)
			//while (bitmap.isEmptyLine(y1,x1, x2)) y1++;

			while (bitmap.isEmptyLine(y2,x1, x2)) y2--;
			var o = {x: x1 -0, y: y1, w: x2 -x1 +1, h: y2 - y1 + 1};
			hlSet.push(o);
			//alert('test')
			x1 =  bitmap.findNextCol(x2 + 1,y1,y2,0);
			if (includeSpace && x1 -x2 >= 0.6 * o.w) { //push space
				hlSet.push({space: true});
				//alert('add space')
			}
		}
		if (includeSpace) {
			hlSet.push({line: true});	
			n ++ ;
		}
	}
	// alert('line ' + n)
	//goo.Highlight(hlSet);
	this.hlSet = hlSet;
};
tool_proto.normalizeCharacterSet = function(){
	for (var i=0; i< this.hlSet.length; i++){
		this.hlSet[i] = goo.Bitmap.resize(this.hlSet[i]);
		//alert(' test')
	}
};

tool_proto.test = function(){
	var bitmap = this.bitmap;
	goo.privContext.clearRect(0,0, bitmap.width, bitmap.height);
	for (var i=0; i< this.hlSet.length; i++){
		var o = this.hlSet[i];
		//alert(o.x)
		var matrix = goo.Bitmap.resize(bitmap.getBitmap(o));
		//alert(matrix)
		goo.drawImage(matrix, o.x, o.y,true);
	}
};
tool_proto.getData = function(){
	var bitmap = this.bitmap;
	var out = [];
	goo.privContext.clearRect(0,0, bitmap.width, bitmap.height);
	var hlSet = this.hlSet;


	for (var i=0; i< this.hlSet.length; i++){
		var o = this.hlSet[i];
		//alert(o.x)
		if (o.space) {
			//alert('space include');
			out.push(' ');
		}
		else if (o.line) {
			out.push(" \n");
			//alert('line')
		}else {
			var matrix = goo.Bitmap.extractFeature(bitmap.getBitmap(o));
			out.push(matrix);
		}
	}
	//alert('out length ' + out.length
	return out;
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
 * goo.UnHighLight {function}
 */
goo.UnHighLight = function(){
	goo.hlContainer.innerHTML = "";
}
/**
 * goo.OCRTool object
 */
goo.OCRTool = function(containerId,onload){
	this.isReady = false;
	this.result = "";  //result text
	var img = new Image();
	var that = this;
	img.onload = function(){
		goo.Initialize(containerId,img.width, img.height); 
		var bitmap = new goo.Bitmap(img);
		bitmap.addHighlightTool();
		bitmap.tool.separateLine(new Point(0,0), new Point(img.width -1 , img.height - 1));
		bitmap.tool.separateChar();
		//goo.Highlight(bitmap.tool.hlSet)
		//get data
		//this.data = bitmap.tool.getData();
		that.preload(bitmap.tool.getData());

	}
	img.src = "images/data6.png";
	
	this.onload = onload;
	this.sampleList = [];
	this.net = null;
	this.map = null;
	this.requireTrain = true;
	this.text = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789(),.'; //--> todo
};
var OCRTool_proto = goo.OCRTool.prototype;
OCRTool_proto.addClipboard = function(clip){
	this.clip = clip;
};
/* 
 * Preload Data
 */
OCRTool_proto.preload = function(data){  
    //alert("preload");
  alert(this.text.length + ',' + data.length)
    for (var i=0,len = data.length; i< len; i++){
  		var ds = new SampleData(this.text[i],goo.config.SAMPLEWIDTH, goo.config.SAMPLEHEIGHT); // size 10x14
  		//alert(this.text[i]);
  		ds.grid = Matrix.clone(data[i])
  		this.sampleList.push(ds);
  		
    }
   // alert(this.sampleList.length)
    // var HANDWRITING = this.const.HANDWRITING;
    // for (var i=0; i< HANDWRITING.length; i++){
    //     var line = HANDWRITING[i];
    //     var ds = new SampleData(line[0], this.const.SAMPLEWIDTH, this.const.SAMPLEHEIGHT);
    //     this.sampleList.push(ds);
    //     var index = 2;
    //     for (var x=0; x < ds.getHeight(); x++){
    //         for (var y=0; y <ds.getWidth(); y++ ){
    //             ds.setData(x, y, line[index++]=='1' ? 1 : 0);
    //         }
    //     }

    // }
    //train
    this.train_actionPerformed();

    if (this.onload && typeof this.onload == 'function') 
    	this.onload();

};

/**
 * Traing action performed
 */
OCRTool_proto.train_actionPerformed = function(){
    var sampleList = this.sampleList;

    var inputCount =goo.config.SAMPLEWIDTH * goo.config.SAMPLEHEIGHT;
    var outputNeuron = sampleList.length; //so luong ky tu huan luyen

    var set = new TrainingSet(inputCount, outputNeuron);
    set.setTrainingSetCount(outputNeuron);
    for (var t = 0; t <sampleList.length; t++){
        var idx = 0;
        var ds = sampleList[t];
        for (var x=0; x<ds.getHeight(); x++){
            for (var y = 0; y<ds.getWidth(); y++){
                set.setInput(t, idx++, ds.getData(x,y));
            }
        }
    }
    this.net = new KohonenNetwork(inputCount, outputNeuron);
    this.net.setTrainingSet(set);


    //check 
    var that = this;
    if (!this.requireTrain){
        console.log("not train");
        that.map =["X","C","E","T","E","H","W","A","H","D","C","T","I","B","P","T","A","H","Q","P","C","M","T","B","Y","J","C","O","E","D","K","A","P","Y","L","D","D","P","P","S","B","E","F","U","S","F","E","E","J","F","O","H","H","I","F","J","J","A","T","U","S","N","D","G","K","N","V","O","I","G","Q","S","L","X","L","X","E","I","L","H","V","R","A","I","H","P","L","F","E","I","K","E","C","U","Z","F","A","I","S","U"];
        that.net.outputWeights=[[-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0],[-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0],[-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0],[-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0],[0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0],[-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0],[-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0],[-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0],[-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0],[-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0],[0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0],[-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0],[0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0],[0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0],[-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0],[-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0],[-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0],[-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0],[-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0],[-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0],[0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0],[-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,0],[-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,-0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,-0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0.0845,0]];
    }
    //train
    else {
        this.net.learn();
        this.map = this.mapNeurons();
    }
    //map neuron
   
  // alert(this.map);
};
/**
 * Recognize action performed
 *
 */
OCRTool_proto.recognize_actionPerformed = function(){

	//get data
	var tool = this.img.tool;
	tool.separateChar(true);
	var data = tool.getData();

    if (this.net == null) {
        alert("I need to be trained first");
        return "";
    }

    this.result = "";

    for (var i=0; i< data.length; i++) {
       	if (typeof data[i] == 'string') {
       		this.result +=data[i];
       		//if (data[i] == " \n") alert('new line')
       		//alert('t'+ data[i] + 't')
       	}else {
	        var input = Array.concat.apply(null, data[i]); //convert 2d array to 1d array
	        var normfac = new Array(1);
	        var best = this.net.winner(input, normfac);
	        // var map = this.mapNeurons();
	        this.result += ""+ this.map[best];
       }
    }
    if ( this.clip) //has clipboard
    	this.clip.setText(this.result);
   	//alert(this.result)
};
OCRTool_proto.getResult = function(){
	return this.result;
}
OCRTool_proto.setImage = function(img){

	this.img = new goo.Bitmap(img, true);
	this.img.draw();
//	this.img.addOCRTool(this);
	this.img.addHighlightTool();

}
/* *
 *  Map neurons
 */
OCRTool_proto.mapNeurons = function(){
    var map = new Array(this.sampleList.length);

    var normfac = new Array(1);
    //normfac[0] = 0;
    for (var i=0; i<map.length; i++)
        map[i] = '?';

    var size = goo.config.SAMPLEWIDTH * goo.config.SAMPLEHEIGHT;

    for (var i=0; i< this.sampleList.length; i++){
        var input = new Array(size);
        var idx = 0;
        var ds = this.sampleList[i];
        for (var x = 0; x < ds.getHeight(); x++) {
            for (var y = 0; y < ds.getWidth(); y++) {
                input[idx++] = ds.getData(x, y);
            }
        }

        var best = this.net.winner(input, normfac);
        map[best] = ds.getLetter();
       // alert(map[best])
    }
   // alert(map);
    return map;
}