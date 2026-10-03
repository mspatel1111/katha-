export function webpDimensions(bytes:Uint8Array){
 const text=(start:number,length:number)=>String.fromCharCode(...bytes.slice(start,start+length));const n=(i:number)=>bytes[i]+(bytes[i+1]<<8)+(bytes[i+2]<<16);
 if(bytes.length<30||text(0,4)!=="RIFF"||text(8,4)!=="WEBP")return null;
 const type=text(12,4);
 if(type==="VP8X")return {width:n(24)+1,height:n(27)+1};
 if(type==="VP8 "&&bytes[23]===0x9d&&bytes[24]===1&&bytes[25]===0x2a)return {width:(bytes[26]|bytes[27]<<8)&0x3fff,height:(bytes[28]|bytes[29]<<8)&0x3fff};
 if(type==="VP8L"&&bytes[20]===0x2f){const bits=(bytes[21]|bytes[22]<<8|bytes[23]<<16|bytes[24]<<24)>>>0;return {width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1};}
 return null;
}
