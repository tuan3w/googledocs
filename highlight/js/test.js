window.onload = function(){
	var img = new Image();
	img.onload = startApp;
	img.src = "images/data.png";
	
	function startApp(){
		alert('load')
		goo.Initialize('container',img.width, img.height); 
		var bitmap = new goo.Bitmap(img);
		//bitmap.histEqualize();
		//bitmap.inverse();
		bitmap.draw();
		bitmap.addTool();
	}

}
