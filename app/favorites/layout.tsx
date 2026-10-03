import {pageMetadata} from "@/lib/seo";
export const metadata={...pageMetadata("Favorites | KATHA","Your saved KATHA collection.","/favorites"),robots:{index:false,follow:false},};
export default function Layout({children}:{children:React.ReactNode}){return children;}
