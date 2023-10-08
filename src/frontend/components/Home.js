import { ethers } from 'ethers';
import { useState, useEffect } from 'react'
import { Row } from 'react-bootstrap'
import NFTAbi from '../contractsData/NFT.json'
import NftBox from './NftBox';


const Home = ({getnft, getmarketplace, getContracts, marketplace, nft, account }) => {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [load, setLoad] = useState(false)
  const [chainId,setChainId] = useState()

  useEffect((()=>{
    getContracts();
  }),[account])

  const loadMarketplaceItems = async () => {

    try {
      // Load all unsold items
      const itemCount = await getmarketplace?.itemCount()
      let items = []
      for (let i = 1; i <=itemCount; i++) { 
        const item = await getmarketplace?.items(i)
        if (!item?.sold) {
          console.log("1");
          const auction = await getmarketplace?.isAuction(item?.tokenId)
          console.log("2");
          const time = await getmarketplace?.getLastTime(item?.itemId)
          console.log("3");
          const temp = Number(time?.toString())
          // get uri url from nft contract
          console.log("4");
          let customHttpProvider = new ethers.providers.JsonRpcProvider("https://ethereum-goerli.publicnode.com");    
          const nft = new ethers.Contract(item?.nft, NFTAbi?.abi,customHttpProvider)
          const uri = await nft?.tokenURI(item?.tokenId)
          if(uri?.slice(uri?.length - 4) == "json") {
           
            const response = await fetch(uri)
            const metadata = await response?.json()
          
          const res = Number(50);
          // const img =  `https://ipfs.io/ipfs/${metadata.image.slice(metadata.image.length - 46)}`
          // console.log("img",img)
          items.push({
            time: temp,
            auction: auction,
            totalPrice: item?.price,
            itemId: item?.itemId,
            seller: item?.seller,
            name: metadata?.name,
            description: metadata?.description,
            image:metadata?.image,
            Royality: res
          })

          }else {
       
          // use uri to fetch the nft metadata stored on ipfs
          // uri.Replace.to("https://gateway.pinata.cloud/ipfs/"+uri)
        
          const link =  `https://ipfs.io/ipfs/${uri.slice(uri.length - 46)}`;
        
          const response = await fetch(link)
            
          const metadata = await response.json()
      
  
          const res = Number(50);
          console.log("withoutjson",metadata?.image)
          // const img =  `https://ipfs.io/ipfs/${metadata.image.slice(metadata.image.length - 46)}`
          // console.log("img",img)
          items.push({
            time: temp,
            auction: auction,
            totalPrice: item?.price,
            itemId: item?.itemId,
            seller: item?.seller,
            name: metadata?.name,
            description: metadata?.description,
            image:metadata?.image,
            Royality: res
          })

          }
        
        }
      
      }
      setItems(items)
      setLoading(false)
    } catch (error) {
      console.log(error);
    }
  }


  useEffect(() => {
    loadMarketplaceItems();
  }, [])


  return (
    <div className="flex justify-center">
 
 {loading ? (
      <main style={{ padding: "1rem 0" }}>
        <h2>Loading...</h2>
      </main>
      ) :

      items.length > 0 ?
        <div className="px-5 container">
          <Row className="mt-5">
            {items.map((item, idx) => (
              <NftBox item={item} idx={idx} setLoading = {setLoad} loading = {load} marketplace={marketplace} account={account} />
            ))}
          </Row>
        </div>
        : (
          <main style={{ padding: "1rem 0" }}>
            <h2>No listed assets</h2>
          </main>
        )}
        </div>
        );
      }

export default Home