"use client";
import Link from "next/link";
import {Heart} from "lucide-react";
import {useLocalValue,writeLocal} from "@/lib/browser-store";
export const FAVORITES_KEY="katha-wishlist-v1";
export function favoriteIds(raw:unknown):number[]{return Array.isArray(raw)?raw.filter((id):id is number=>Number.isInteger(id)&&id>0).slice(0,100):[];}
export function readFavorites(){try{return favoriteIds(JSON.parse(localStorage.getItem(FAVORITES_KEY)??"[]"));}catch{return [];}}
export function FavoriteButton({productId,showLabel=false}:{productId:number;showLabel?:boolean}){const ids=favoriteIds(useLocalValue(FAVORITES_KEY,true));const favorite=ids.includes(productId);return <button type="button" className={"favorite-button"+(favorite?" active":"")+(showLabel?" with-label":"")} onClick={()=>writeLocal(FAVORITES_KEY,favorite?ids.filter(id=>id!==productId):[...ids,productId])} aria-label={favorite?"Remove from favorites":"Add to favorites"} aria-pressed={favorite}><Heart aria-hidden="true"/>{showLabel&&<span>{favorite?"Saved to favorites":"Add to favorites"}</span>}</button>;}
export function FavoritesLink(){const ids=favoriteIds(useLocalValue(FAVORITES_KEY,true));return <Link href="/favorites" className="favorites-link" aria-label={"Favorites with "+ids.length+" items"}><Heart/><span>{ids.length}</span></Link>;}
