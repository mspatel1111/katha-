"use client";
import { useSyncExternalStore } from "react";
const fallbackMemory=new Map<string,string>();
export function readLocal(key:string,fallback="{}"){try{return localStorage.getItem(key)??fallbackMemory.get(key)??fallback;}catch{return fallbackMemory.get(key)??fallback;}}
export function subscribeLocal(key: string, callback: () => void) {
  const changed = (event: Event) => {
    if (event instanceof StorageEvent && event.key && event.key !== key) return;
    callback();
  };
  const events = ["storage", key, "katha-cart-updated", "katha-wishlist-updated"];
  events.forEach(name => window.addEventListener(name, changed));
  return () => events.forEach(name => window.removeEventListener(name, changed));
}
export function parseLocalValue(raw:string,array=false){
  try{const value=JSON.parse(raw);if(array?Array.isArray(value):value!==null&&typeof value==="object"&&!Array.isArray(value))return value;}catch{/* Use the expected empty shape for corrupt storage. */}
  return array?[]:{};
}
export function useLocalValue(key: string, array = false) {
  const fallback = array ? "[]" : "{}";
  const raw = useSyncExternalStore(
    (callback) => subscribeLocal(key, callback),
    () => readLocal(key,fallback),
    () => fallback,
  );
  return parseLocalValue(raw,array);
}
export function writeLocal(key: string, value: unknown) {
  const raw=JSON.stringify(value);fallbackMemory.set(key,raw);
  try{localStorage.setItem(key,raw);}catch{/* Retain device-local state in memory when storage is blocked. */}
  window.dispatchEvent(new Event(key));
}
