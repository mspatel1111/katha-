"use client";
import {lazy,Suspense} from "react";
import {useStore} from "./store-provider";
const Drawer=lazy(()=>import("./cart-drawer").then(module=>({default:module.CartDrawer})));
export function LazyCart(){const {bagOpen}=useStore();return bagOpen?<Suspense fallback={<div role="status" className="bag-loading">Opening your bag…</div>}><Drawer/></Suspense>:null;}
