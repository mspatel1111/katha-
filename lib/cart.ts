import {SIZES,type Product,type Size} from "./catalog";
export const CART_KEY="katha-cart-v1";
export type Cart=Record<string,number>;
export function parseCart(value:unknown):Cart{
 if(!value||typeof value!=="object"||Array.isArray(value))return {};
 const next:Cart={};
 for(const[key,quantity]of Object.entries(value)){
  const match=/^(\d+)-(S|M|L|XL|XXL|XXXL)$/.exec(key);
  if(match&&typeof quantity==="number"&&Number.isInteger(quantity)&&quantity>0)next[key]=Math.min(10,quantity);
 }
 return next;
}
export function cartLines(cart:Cart,products:Product[],prices:Record<string,number>={}){
 return Object.entries(cart).map(([key,quantity])=>{
  const[id,sizeText]=key.split("-");const size=sizeText as Size;
  const product=products.find(p=>p.id===Number(id));
  const available=Boolean(product?.active&&!product.archived&&product.stock[size]>0);
  const stock=available?product!.stock[size]:0;
  return {key,product,size,quantity,available,stock,stockChanged:quantity>stock,priceChanged:!!product&&prices[key]!==undefined&&prices[key]!==product.price};
 });
}
export function changeCartSize(cart:Cart,key:string,size:Size,product:Product):Cart{
 if(!SIZES.includes(size)||!product.stock[size])return cart;
 const next={...cart};const quantity=next[key]??0;delete next[key];
 const newKey=product.id+"-"+size;next[newKey]=Math.min(10,product.stock[size],(next[newKey]??0)+quantity);
 return next;
}
