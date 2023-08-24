import { useRouter } from 'next/router'
import Home from './index'


export default function UrlHome() {
    
    const router = useRouter()
    const { urlPubkey } = router.query

    return Home(urlPubkey)
}