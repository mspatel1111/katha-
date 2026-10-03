"use client";
import Link from "next/link";
import {Sheet,SheetClose,SheetContent,SheetDescription,SheetHeader,SheetTitle} from "@/components/ui/sheet";
import {CATEGORIES} from "@/lib/catalog";
export default function HomeDrawers({onClose,restoreFocus}:{mode:"menu";onClose:()=>void;restoreFocus:()=>void}){
 return <Sheet open onOpenChange={open=>{if(!open)onClose();}}><SheetContent id="katha-mobile-menu" side="left" className="menu-sheet" onCloseAutoFocus={event=>{event.preventDefault();restoreFocus();}}><SheetHeader><SheetTitle>Browse KATHA</SheetTitle><SheetDescription>Find your next favourite style.</SheetDescription></SheetHeader><nav className="mobile-nav">{[["/","Home"],["/shop","Shop all"],...CATEGORIES.map(c=>["/shop?category="+encodeURIComponent(c),c]),["/contact","Contact us"],["/track-order","Track order"],["/faq","FAQ"]].map(([href,label])=><SheetClose key={href} asChild><Link href={href}>{label}</Link></SheetClose>)}</nav></SheetContent></Sheet>;
}
