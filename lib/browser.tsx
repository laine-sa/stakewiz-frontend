// Safari browser check
export const check = (name:string) => {
    if (typeof window !== "undefined") {
        // console.log(`check for : ${name} , user's device is: ${window.navigator.userAgent}`);
        return navigator.userAgent.indexOf(name) != -1;
    }else{
        return false;
    }  
}
