import {blankProduct,slugify,type Category,type Product,type ProductColor} from "./catalog";

// Owner-requested catalog starters, not claims of real stock or distinct photographs.
export const DRAFT_CATALOG_KEY="catalog_drafts_100_v1";
const names=["Aarohi","Aabha","Anaya","Avni","Charvi","Diya","Gul","Ira","Jiya","Kavya","Leher","Mira","Naina","Navya","Noor","Pankhuri","Ruhani","Saanvi","Tara","Vanya"];
const references:{asset:string;color:ProductColor}[]=[
 {asset:"katha-blue-mirror-look",color:"Blue"},
 {asset:"katha-emerald-look",color:"Green"},
 {asset:"katha-mustard-look",color:"Mustard"},
 {asset:"katha-violet-look",color:"Violet"},
 {asset:"katha-rust-look",color:"Rust"},
 {asset:"katha-teal-look",color:"Blue"},
 {asset:"katha-wine-look",color:"Maroon"},
 {asset:"katha-black-kurta",color:"Black"},
];
const groups:{category:Category;code:string;title:string;count:number}[]=[
 {category:"Kurtis",code:"KUR",title:"Kurti",count:40},
 {category:"Sarees",code:"SAR",title:"Saree",count:20},
 {category:"Co-ord Sets",code:"COR",title:"Co-ord Set",count:15},
 {category:"Festive Wear",code:"FES",title:"Festive Edit",count:15},
 {category:"Dupattas",code:"DUP",title:"Dupatta",count:10},
];
export const DRAFT_PRODUCTS:Product[]=groups.flatMap(group=>Array.from({length:group.count},(_,index)=>{
 const reference=group.category==="Sarees"
  ?{asset:index%2?"katha-pink-saree":"katha-blue-saree",color:(index%2?"Pink":"Blue") as ProductColor}
  :group.category==="Co-ord Sets"
   ?{asset:index%2?"katha-maroon-set":"katha-blue-set",color:(index%2?"Maroon":"Blue") as ProductColor}
   :references[index%references.length];
 const name=names[index%names.length]+" "+group.title+(index>=names.length?" — Edit "+(Math.floor(index/names.length)+1):"");
 const image="/images/"+reference.asset+"-1600w.webp";
 return {...blankProduct(),name,sku:"KATHA-DRAFT-"+group.code+"-"+String(index+1).padStart(3,"0"),
  slug:"draft-"+slugify(name),category:group.category,color:reference.color,image,
  images:[{url:image,alt:"Temporary KATHA reference photo for "+name,primary:true,displayOrder:0}],
  price:0,active:false,featured:false,newArrival:false,bestseller:false,
  label:"Draft",displayOrder:100+groups.slice(0,groups.indexOf(group)).reduce((sum,item)=>sum+item.count,0)+index,
  dispatchTime:"",description:name+" is a draft catalog concept. Add the actual product photograph, selling price, stock, fabric, measurements and care details before making this product visible. The current image is a reused KATHA reference, not a photograph of a new product.",
 };
}));
