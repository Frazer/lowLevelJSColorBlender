

//from https://gist.github.com/borismus/1032746
var BASE64_MARKER = ';base64,';
function convertDataURIToBinary(dataURI) {
	var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
	var base64 = dataURI.substring(base64Index);
	var raw = window.atob(base64);

	/* then it seems I need to reverse engineer raw to this:
				file = ('BM' +               // "Magic Number"
                num_file_bytes +     // size of the file (bytes)*
                '\x00\x00' +         // reserved
                '\x00\x00' +         // reserved
                '\x36\x00\x00\x00' + // offset of where BMP data lives (54 bytes)
                '\x28\x00\x00\x00' + // number of remaining bytes in header from here (40 bytes)
                width +              // the width of the bitmap in pixels*
                height +             // the height of the bitmap in pixels*
                '\x01\x00' +         // the number of color planes (1)
                '\x18\x00' +         // 24 bits / pixel
                '\x00\x00\x00\x00' + // No compression (0)
                num_data_bytes +     // size of the BMP data (bytes)*
                '\x13\x0B\x00\x00' + // 2835 pixels/meter - horizontal resolution
                '\x13\x0B\x00\x00' + // 2835 pixels/meter - the vertical resolution
                '\x00\x00\x00\x00' + // Number of colors in the palette (keep 0 for 24-bit)
                '\x00\x00\x00\x00' + // 0 important colors (means all colors are important)
                _collapseData(rows, row_padding)
							 );
		ie:
		raw: "BMB@@...!"

	*/

	let num_file_bytes = littleEndianHexToNumber(raw,2);  // this is always returning the same as raw.length, gives confidence the approach is correct
	let BMPdataOffset =  littleEndianHexToNumber(raw,10);
	imageController.width = littleEndianHexToNumber(raw,18);
	imageController.height = littleEndianHexToNumber(raw,22);
	let bitsPerPixel = raw.charCodeAt(28);
	if(bitsPerPixel!=24){
		throw "Unsupported file format";
	}
	let num_data_bytes = littleEndianHexToNumber(raw,34);   // is always returning the same as (num_file_bytes - BMPdataOffset), seems correct
	let pixelsPerMeter = littleEndianHexToNumber(raw,38);   // is always returning the same as (num_file_bytes - BMPdataOffset), seems correct
	debugger

	imageController.row_padding = (4 - (imageController.width * 3) % 4) % 4
	          
            
	var array = new Uint8Array(new ArrayBuffer(num_data_bytes));
	for(let i = BMPdataOffset, j=0; i < num_file_bytes; i++,j++) {
		array[j] = raw.charCodeAt(i);
	}
	return array;
}

const littleEndianHexToNumber =(raw, index) =>{
	// Convert value from little endian hex bytes
	// 
	return raw.charCodeAt(index)+(raw.charCodeAt(index+1)<<8)+(raw.charCodeAt(index+2)<<16) +(raw.charCodeAt(index+3)<<24);
	
}
const convertTo2d = (data) =>{
	let arrays = [];
	let rowCounter = 0;
	arrays[rowCounter]=[];
	let widthCounter = 0;
	for (let index = 0; index < data.length; index = index+3) {
		arrays[rowCounter].push([data[index+2], data[index+1], data[index]]);
		widthCounter++;
		if(widthCounter==imageController.width){
			index+=imageController.row_padding;//skip padding   -  but the padding doesnt seem to be there
			rowCounter++;
			widthCounter = 0;
			if(rowCounter<imageController.height){
				arrays[rowCounter]=[];
			}
		}
	}

	/**
	 * many bitmaps were distorted and failing
	 * this fixes the failing, not the distortion
	 */
	// delete arrays[arrays.length-1];
	// arrays.length--;
	
	
	return arrays;

}


const displayRecentDrop = (file) =>{
	//make userActions content disappear
	document.querySelector("#userActions").style.display='none';
	document.querySelector("#userActions p").style.display='none';

	imageController.img = document.querySelector('img#colorBlender');
	imageController.img.src = file;
	imageController.img.onload = function() {
		try {
			let data = convertDataURIToBinary(file);

			imageController.originalDataIn2D = convertTo2d(data);

			// originalDataIn2D is not the correct size
			// in fact, I dont know how it could possibly be,
			// as the number of bytes is not as big as width*3*height
			
			imageController.updateImage();
		}
		catch(e) {
			alert(e);
		}
		
		
	}
	
}

imageController.updateImage = ()=>{

	let imageSrc = generateBitmapDataURL(doColorBlending());

	imageController.img.src = imageSrc;

}

const doColorBlending = ()=>{
	/** 
	 * naive solution
	 * on each pixel find difference from max or min, then adjust accordingly
	 * ie:
	 *  (800) adjusted red:100 gives f00
	 *  (800) adjusted red:50 gives b00
	 *  (800) adjusted blue:100 gives 80f
	 *  (800) adjusted blue:50 gives 808
	*/

	let r = imageController.r.value,
			g = imageController.g.value,
			b = imageController.b.value;
	
	let rows = imageController.originalDataIn2D;
	var i,
			rows_len = rows.length,
			j,
			pixels_len = rows_len ? rows[0].length : 0,
			result = [];


	for (i=0; i<rows_len; i++) {
		let row = result[i]=[];
		for (j=0; j<pixels_len; j++) {
				pixel = rows[i][j];
				row.push([blend(pixel[0],r),blend(pixel[1],g),blend(pixel[2],b)]);
		}
	}
	return result;


}

let blend = (pixelValue,blendValue) =>{
	if(blendValue == 0){
		return pixelValue;
	}else if(blendValue > 0){
		//find 'distance' from 255
		let d = 255 - pixelValue;
		let changeVal = Math.floor(d*blendValue/100);
		return pixelValue+changeVal;
	}else if(blendValue < 0){
		let changeVal = Math.ceil(pixelValue*blendValue/100);
		return pixelValue+changeVal;
	}
}