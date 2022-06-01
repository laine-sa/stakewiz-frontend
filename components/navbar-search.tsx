import React, {useState, useEffect, useContext, FC} from 'react';
import Link from 'next/link';
import { useWallet} from '@solana/wallet-adapter-react';
import { RenderImage } from './validator/common'
import config from '../config.json';
import { ValidatorContext } from './validator/validatorhook'

const API_URL = process.env.API_BASE_URL;

interface ValidatorData {
  name: string;
  vote_identity: string;
  identity: string,
  activated_stake : number,
  image : string
}

  export const ValidatorFilterData: FC<{
    filteredValidator: ValidatorData; 
  }> = ({filteredValidator}) => {
    const activated_stake = new Intl.NumberFormat().format(Number(filteredValidator.activated_stake.toFixed(0)));
    return (
      <>
        <li className="item">
          <Link
            href={"/validator/" + filteredValidator.vote_identity}
            passHref
            >
            <a>
            {(filteredValidator.image) && 
              <div className="validator-img">
                <RenderImage
                    img={(filteredValidator.image)}
                    vote_identity={filteredValidator.vote_identity}
                    size={50}
                />
              </div>
            }
              <div className="validator-info">
                <div className="validator-title">
                    <b>{filteredValidator.name}</b>
                  
                </div>
                <div className={`scroll-description ${(!filteredValidator.image) ? 'scroll-descrip-full-Width' : ''}`}>
                  <span className="validator-description text-truncate">
                    <b>Identity:</b>&nbsp;{filteredValidator.identity}
                  </span>
                  <span className="validator-description text-truncate">
                    <b>Vote Identity:</b>&nbsp;
                    {filteredValidator.vote_identity}
                  </span>
                  <span className="validator-description">
                    <b>Activated Stake:</b>&nbsp;
                    ◎ {activated_stake}
                  </span>
                </div>
              </div>
              </a>
              </Link>
              <div className="clrFix"></div>
        </li>
      </>
    )

  }

  const GlobalSearch: FC<{
    mobilehide : string,
    elementID : string,
    validatorList ? : string[],
    showSearchValidators ? : boolean
    }> = ({ mobilehide, elementID }) => {
    const validatorList = useContext(ValidatorContext);
    useEffect(() => {
      setSearchValidators(validatorList)
    },[validatorList])
    const [hasFilterData, setHasFilterData] = useState(false);
    const [searchValidators, setSearchValidators] = useState([]);
    const [searchFilterValidators, setSearchFilterValidators] = useState([]);
    const [showSearchValidators, setShowSearchValidators] = useState(false);
    const [searchInput, setSearchInput] = useState('');

    const doSearch = async(key, searchTitle) => {
        setSearchInput(searchTitle)
        const filteredValidators = [];
        if(searchTitle.length > config.DEFAULT_SEARCH_KEY_COUNT){
          for (let i = 0; i < searchValidators.length; i++) {
            
            let stakeRatio = searchValidators[i].stake_ratio*1000;
            let commission = searchValidators[i].commission;
            let name = searchValidators[i].name;
            let txtValue = searchValidators[i].name + searchValidators[i].identity + searchValidators[i].vote_identity;
            let vote_identity = searchValidators[i].vote_identity;
            
            if (txtValue.toUpperCase().indexOf(searchTitle.toUpperCase()) > -1 ) {
                if((name=='')) {
                  continue;
                }
                else{
                  let sf = "rank_asc"
                  sf = sf.substring(0,sf.length-4);
                  filteredValidators.sort((a,b) => (a[sf] > b[sf]) ? 1 : ((b[sf] > a[sf]) ? -1 : 0));
                  filteredValidators.push(searchValidators[i]);
                }
            }   
        }
          if(filteredValidators.length > 0){
            setHasFilterData(true)
          }
          else{
            setHasFilterData(false)
          }
          setSearchFilterValidators(filteredValidators)
          setShowSearchValidators(true)
        }
        else{
          setShowSearchValidators(false)
        }
    }
 
  return (
    <>
      <div className={`search-container ${mobilehide}`} >
          <input className={`search expandright ${(showSearchValidators) ? 'src-active' : ''}`} id={elementID} type="search" name="search" placeholder="Search validators..."        
          onChange={(e) => {doSearch(e.target.name, e.target.value)}}  autoComplete="off" value={searchInput} />
          <label className={`btnSearch searchbtn ${(showSearchValidators) ? 'btnSearch-active' : ''}`} htmlFor={elementID}>
            <span className="mglass">⚲</span></label>
        {(hasFilterData && showSearchValidators) ?
            <div className="search-result-div scrollSrc">
                  <ul className="validators-list validator-list-in-box">
                    <div className="search-result-heading"></div>
                      {  searchFilterValidators.map((validator) =>
                        <ValidatorFilterData
                        key={validator.identity}
                        filteredValidator={validator}
                      />
                    )}
                  </ul>
            </div>
            : (!hasFilterData && showSearchValidators) ? 
                <div className="search-result-div scrollSrc">
                   No Results Found
                </div>
            : null
        }
      </div>
    </>
  )

}
export default GlobalSearch;