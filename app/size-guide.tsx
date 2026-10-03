import { SIZE_GUIDE, SIZE_NOTE } from "@/lib/size-guide";
export function SizeTable() {
 return <><div className="table-scroll"><table className="size-table"><caption>Size guide — body measurements (inches)</caption><thead><tr><th scope="col">Size</th><th scope="col">Bust</th><th scope="col">Waist</th><th scope="col">Hip</th></tr></thead><tbody>{SIZE_GUIDE.map(row=><tr key={row.size}><th scope="row">{row.size}</th><td>{row.bust}</td><td>{row.waist}</td><td>{row.hip}</td></tr>)}</tbody></table></div><p>{SIZE_NOTE}</p></>;
}
