import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
import Navigation from './Navbar';
import Home from './Home.js'
import Create from './MintNFT.js'
import MyListedItems from './MyListedItems.js'
import MyPurchases from './My NFTs.js'
import MarketplaceAbi from '../contractsData/Marketplace.json'
import MarketplaceAddress from '../contractsData/Marketplace-address.json'
import NFTAbi from '../contractsData/NFT.json'
import NFTAddress from '../contractsData/NFT-address.json'
import { useEffect, useState } from 'react'
import { ethers } from "ethers"
import { Spinner } from 'react-bootstrap'
import './App.css';
import GetNfts from "./getNfts";
const { ethereum } = window;


function App() {
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState(null)
  const [nft, setNFT] = useState({})
  const [marketplace, setMarketplace] = useState({})
  const [signer, setSigner]=useState();
  const [getnft, setGetNFT] = useState({})
  const [getmarketplace, setGetMarketplace] = useState({})



  const changeNetwork = async () => {
    try {
      setLoading(true)
      if (!ethereum) throw new Error("No crypto wallet found");
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{
          chainId: "0x7A69"
          // chainId: "0x05"
        }]
      });
      await web3Handler();
      setLoading(false)
    } catch (err) {
      setLoading(false)
      console.log(err.message);
    }
  };
 


  const checkIsWalletConnected = async () => {  
    try {
      if (!ethereum) return alert("please install MetaMask");
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length) {
        setAccount(accounts[0]);
        // console.log("Account", accounts[0])
        // Get provider from Metamask
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        // Set signer
        const signer = provider.getSigner()
        loadContracts(signer)
      } else {
        console.log("No account Found");
      }
      
      ethereum.on("accountsChanged", async (account) => {
        setAccount(account[0]);
        window.location.reload()
      })

      window.ethereum && ethereum.on("chainChanged", async (chainId) => {
        if (chainId != "0x5") {
          await ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [
                  {
                      chainId: "0x5" //Goerli
                      // chainId: "0x89", //PolygonMainnet
                      //chainId: "0xaa36a7", //sepolia
                      // chainId: "0x1", //Miannet
                      // chainId: "0x7A69" //localHost TODO
                  },
              ],
          });
      }
       
      });
    } catch (err) {

      throw new Error("No ethereum Object");
    }
  }

  useEffect(() => {
    checkIsWalletConnected();
  }, [])



  // MetaMask Login/Connect
  const web3Handler = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setAccount(accounts[0])
    // Get provider from Metamask
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    // Set signer
    const signer = provider.getSigner()
    setSigner(signer);
    
    window.ethereum.on('chainChanged', (chainId) => {
      window.location.reload();
    })
  

    window.ethereum.on('accountsChanged', async function (accounts) {
      setAccount(accounts[0])
      await web3Handler()
    })
    loadContracts(signer)
  }

  const loadContracts = async (signer) => {
    // Get deployed copies of contracts
    const marketplace = new ethers.Contract(MarketplaceAddress.address, MarketplaceAbi.abi, signer)
    setMarketplace(marketplace)
    const nft = new ethers.Contract(NFTAddress.address, NFTAbi.abi, signer)
    setNFT(nft)
    setLoading(false)
  }

  const getContracts = async () => {
    // Get deployed copies of contracts
    let customHttpProvider = new ethers.providers.JsonRpcProvider("https://ethereum-goerli.publicnode.com");
    const marketplace = new ethers.Contract(MarketplaceAddress.address, MarketplaceAbi.abi, customHttpProvider)
    setGetMarketplace(marketplace)
    const nft = new ethers.Contract(NFTAddress.address, NFTAbi.abi, customHttpProvider)
    setGetNFT(nft)
    setLoading(false)
  }

  useEffect((()=>{
    getContracts();
  }),[account])

  return (
    <BrowserRouter>
      <div className="App">
        <>
          <Navigation web3Handler={changeNetwork} account={account} />
        </>
        <div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
              <Spinner animation="border" style={{ display: 'flex' }} />
              <p className='mx-3 my-0'>Awaiting Metamask Connection...</p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={
                <Home getnft={getnft} getmarketplace={getmarketplace} getContracts={getContracts} signers={signer} marketplace={marketplace} nft={nft} account={account} />
              } />
              <Route path="/create" element={
                <Create marketplace={marketplace} nft={nft} />
              } />
              <Route path="/my-listed-items" element={
                <MyListedItems marketplace={marketplace} nft={nft} account={account} />
              } />
              <Route path="/my-purchases" element={
                <MyPurchases marketplace={marketplace} NFTAbi={NFTAbi.abi} signers={signer}  account={account} />
              }  />
            </Routes>
          )}
        </div>
      </div>
    </BrowserRouter>

  );
}

export default App;