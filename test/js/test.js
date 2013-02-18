var isRightClick = false;
window.onload = function(){
	// var img = new Image();
	// img.onload = startApp;
	// img.src = "images/data.png";
	
	// function startApp(){
	// 	goo.Initialize('container',img.width, img.height); 
	// 	var bitmap = new goo.Bitmap(img);
	// 	//bitmap.histEqualize();
	// 	//bitmap.inverse();
	// 	bitmap.draw();
	// 	bitmap.addTool();
	// 	bitmap.tool.process(new Point(0,0), new Point(img.width, img.height));
	// 	bitmap.tool.separateChar();

	// 	tool = bitmap.tool;
	// 	//var hlSet = tool.getHighLightSet();
	// 	//tool.normalizeCharacterSet();
	// 	tool.test();
	// }
	//goo.Initialize('container',800,400); 
	ocrTool = new goo.OCRTool('container',startApp);
	function startApp(){
		var img = new Image();
		img.src = 'images/test7.png';

		img.onload = function(){
			ocrTool.setImage(img);
		};
	}
	copyEle = document.getElementById('copy');
	clip = new ZeroClipboard(copyEle, {
		moviePath: "ZeroClipboard.swf"
	});
	
	ocrTool.addClipboard(clip);
	document.oncontextmenu = function(e){
				//alert('click')
		var x = e.clientX ;
		var y = e.clientY;
		console.log(x + "," + y)
		copyEle.style.left = x + "px";
		copyEle.style.top = y + "px";
		copyEle.style.display = 'block';
		//isRightClick = true;
		ocrTool.recognize_actionPerformed();
		//alert('isRight')
		return false;
	}
	document.addEventListener('click',copy, false);
	function copy(){
		copyEle.style.display = 'none';
		isRightClick = false;
	}
	
	
	
}
