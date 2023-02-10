import Moralis  from 'moralis';
import { EvmChain } from '@moralisweb3/evm-utils';
import React, { useEffect } from 'react'


const MoralisApi = ({ chainId, marketplace, nft, account }) => {
    
const GetData = async()=>{
    try {
        const address = account;
    
        const chain=chainId;
    
        await Moralis.start({
            apiKey:"JfvvwcXHSP8hS9TyReRQllMHoU33yGZJXms1dCVkuOCZ1dBlUloUyjp7qyumsW3Y",
            // ...and any other configuration
        });
    
        const response = await Moralis.EvmApi.nft.getWalletNFTs({
            address,
            chain,
        });
    
        console.log(response?.result);
    } catch (e) {
        console.error(e);
    }
}

return (
    
    <div>
      {/* <button onClick={GetData}>hi</button> */}
    </div>
  )
}

export default MoralisApi


