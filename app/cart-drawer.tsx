"use client";
import Link from "next/link";
import {Sheet,SheetContent,SheetTitle,SheetHeader,SheetDescription,SheetFooter,SheetClose} from "@/components/ui/sheet";
import {Progress} from "@/components/ui/progress";
import {ResponsiveImage} from "@/app/responsive-image";
import {money,SIZES} from "@/lib/catalog";
import {useBag} from "./store-provider";
export function BagLines(){
 const bag=useBag();
 return <div className="cart-items">{bag.lines.map(line=><article className="cart-item" key={line.key}>
  {line.product&&<ResponsiveImage src={line.product.image} alt={line.product.name} sizes="80px" loading="lazy"/>}
  <div><h3>{line.product?.name??"Unavailable product"}</h3>
   {line.product&&<p>{money(line.product.price)}</p>}
   {line.available?<><label className="cart-size">Size<select aria-label={"Size for "+line.product!.name} value={line.size} onChange={e=>bag.changeSize(line.key,e.target.value as typeof line.size,line.product!)}>{SIZES.map(size=><option key={size} disabled={!line.product!.stock[size]}>{size}</option>)}</select></label><label>Quantity<input aria-label={"Quantity for "+line.product!.name} type="number" min={1} max={Math.min(10,line.stock)} value={line.quantity} onChange={e=>bag.change(line.key,Number(e.target.value))}/></label></>:<p role="alert">This style is no longer available.</p>}
   {line.priceChanged&&<p role="status">The price has changed. The current price is shown above.</p>}
   {line.stockChanged&&line.available&&<p role="alert">Only {line.stock} left. <button onClick={()=>bag.change(line.key,line.stock)}>Update quantity</button></p>}
   <button className="text-link" onClick={()=>bag.change(line.key,0)}>Remove</button>
  </div>
 </article>)}</div>;
}
export function ShippingProgress(){
 const bag=useBag();const threshold=bag.settings.freeShippingThreshold;
 if(!threshold||!bag.subtotal)return null;
 const remaining=Math.max(0,threshold-bag.subtotal);
 return <div className="shipping-progress"><p>{remaining?"Add "+money(remaining)+" for free shipping.":"Your order qualifies for free shipping."}</p><Progress value={Math.min(100,100*bag.subtotal/threshold)}/></div>;
}
export function CartDrawer(){
 const bag=useBag();
 return <Sheet open={bag.bagOpen} onOpenChange={open=>{if(!open)bag.closeBag();}}><SheetContent className="cart-sheet" onCloseAutoFocus={event=>{event.preventDefault();bag.restoreBagFocus();}}>
  <SheetHeader><SheetTitle>Shopping bag ({bag.count})</SheetTitle><SheetDescription>Review your styles and delivery charges.</SheetDescription></SheetHeader>
  {bag.error&&<p role="alert">{bag.error} <button onClick={()=>void bag.refresh().catch(()=>undefined)}>Retry</button></p>}
  {!bag.ready&&!bag.error?<p role="status">Refreshing your bag…</p>:<BagLines/>}
  {!bag.count?<p>Your bag is empty. <SheetClose asChild><Link href="/shop">Explore the collection</Link></SheetClose></p>:<SheetFooter className="cart-footer"><ShippingProgress/><div className="subtotal"><span>Subtotal</span><strong>{money(bag.subtotal)}</strong></div><div className="subtotal"><span>Shipping</span><strong>{bag.shipping?money(bag.shipping):"Free"}</strong></div><div className="subtotal"><span>Total</span><strong>{money(bag.total)}</strong></div>{bag.invalid?<p role="alert">Update unavailable items before checkout.</p>:<SheetClose asChild><Link href="/checkout" className="checkout-link">Proceed to checkout</Link></SheetClose>}<SheetClose asChild><Link href="/shop">Continue shopping</Link></SheetClose></SheetFooter>}
 </SheetContent></Sheet>;
}
