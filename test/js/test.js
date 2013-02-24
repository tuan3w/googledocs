window.onload = function(){
	ocrTool = new goo.OCRTool('container',startApp);
	function startApp(){
		var img = new Image();
		img.src = 'images/test6.png';

		img.onload = function(){
			ocrTool.setImage(img);
		};
	}
	copyEle = document.getElementById('copy');
	clip = new ZeroClipboard(copyEle, {
		moviePath: "js/ZeroClipboard.swf"
	});
	
	ocrTool.addClipboard(clip);
	document.oncontextmenu = function(e){
		var x = e.clientX ;
		var y = e.clientY;
		console.log(x + "," + y)
		copyEle.style.left = x + "px";
		copyEle.style.top = y + "px";
		copyEle.style.display = 'block';
		ocrTool.recognize_actionPerformed();
		return false;
	}
	document.addEventListener('click',copy, false);
	function copy(){
		copyEle.style.display = 'none';
		isRightClick = false;
	}
	
	
	
}
