import { FC } from "react";
import Link from "next/link";
import Image from "next/image";
import { validatorI } from "./interfaces";

export const StakeLabel: FC<{stake: number}> = ({stake}) => {
    
    if(stake!=null) {
        let s = (stake<0) ? stake*-1 : stake;
        let n = new Intl.NumberFormat().format(Number(s.toFixed(0)));
        
        s = parseFloat(n);
        
        if(stake<0) {
            
            return (
                <span className="ms-2">
                    - ◎ {n}
                </span>
            );
        }
        else {
            return (
                <span className="ms-2">
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
        
    return (
        <Link href={'/validator/'+vote_identity} passHref>
            <a>
                <Image 
                    className={(className!=undefined) ? className+" rounded-circle pointer " : " rounded-circle pointer "} 
                    src={(img==null) ? '/images/validator-image-na.png' : img} 
                    width={size} 
                    height={size} 
                    loading="lazy" 
                    alt={vote_identity+"-logo"} />
            </a>
        </Link>
    )
}

export const RenderName: FC<{
    validator: validatorI
}> = ({validator}) => {
    if(validator.name=='') {
        return <span>{validator.vote_identity}</span>;
    }
    else {
        return <span>{validator.name}</span>;
    }
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