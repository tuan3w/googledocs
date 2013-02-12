window.onload = function(){
	
	var img = new Image();
	img.src = "images/data.png";
	img.onload = startApp;

	function startApp(){
		goo.Initialize('container',img.width, img.height); 
		var bitmap = new goo.Bitmap(img);
		bitmap.histEqualize();
		//bitmap.inverse();
		bitmap.draw(0,0);
		bitmap.addTool();
	}

}
