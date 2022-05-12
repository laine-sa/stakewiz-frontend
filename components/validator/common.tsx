import { FC } from "react";
import Link from "next/link";
import Image from "next/image";

export const StakeLabel: FC<{stake: number}> = ({stake}) => {
    
    if(stake!=null) {
        let s = (stake<0) ? stake*-1 : stake;
        let n = new Intl.NumberFormat().format(Number(s.toFixed(0)));
        
        s = parseFloat(n);
        
        if(stake<0) {
            
            return (
                <span className="text-danger ms-1">
                    - ◎ {n}
                </span>
            );
        }
        else {
            return (
                <span className="text-success ms-1">
                    + ◎ {n}
                </span>
            );
        }
    }
    else {
        return null;
    }

}

export const RenderImage: FC<
    {
        img:string,
        vote_identity:string,
        size:number,
        className?: string
    }> = ({ img, vote_identity, size, className }) => {
        
    if(img==null) {
        return null;
    }
    else return (
        <Link href={'/validator/'+vote_identity} passHref>
            <a>
                <Image className={(className!=undefined) ? className+" rounded-circle pointer " : " rounded-circle pointer "} src={img} width={size} height={size} loading="lazy" alt={vote_identity+"-logo"} />
            </a>
        </Link>
    )
}

export const RenderUrl: FC<{url:string}> = ({url}) => {
    if(url==null || url=='') {
        return null;
    }
    else {
        return (
            <a href={url} target="_new">
                <span className="fst-normal text-white pointer" >{url}</span>
            </a>
        );
    }
}