import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card, Button, ModalBody } from 'react-bootstrap'
import { Modal, ModalHeader, Form } from "reactstrap"
import MintedBox from './MintedBox';
import Moralis from 'moralis';
import { EvmChain } from '@moralisweb3/evm-utils';
import MoralisApi from './MoralisApi'
import { useAccount } from "wagmi";
import axios from "axios";




export default function MyPurchases({ marketplace, NFTAbi,signers, account }) {
  const [loading, setLoading] = useState(false)
  const [load, setLoad] = useState(false);
  const [Bid, setBid] = useState(true);
  const [purchases, setPurchases] = useState([])
  const [chainId, setChainId] = useState();
  const [nfts, setNfts] = useState([]);

  



  const getChainId = () => {
    const id = Number(window.ethereum.chainId)
    setChainId(id)
  }

      // /////////////////moralis////////
      const GetData = async () => {
        try {
            const chainId = "0x5";
           const response = await axios.get(`http://localhost:5000/getnfts`, {
              params: {account,chainId},
            })
            .then((response) => {
              setNfts(response.data.result); 
        });
        
        }
         catch (e) {
          console.error(e);
        }
      }



  const getPendingReturns = async () => {
    try {
      const getbid = await marketplace.getPendingReturns(account);
      if (getbid > 0) {
        setBid(false);
      }
    } catch (error) {
      console.log(error)
    }
  }



  const withdraw = async (account) => {
    try {
      setLoad(true);
      await (await marketplace.withdraw(account)).wait();
      setLoad(false);
      window.location.reload()
    } catch (error) {
      setLoad(false);
      console.log(error);
    }

  }

  useEffect(() => {
    getChainId();  
  }, [])

  useEffect(() => {
    GetData();
    getPendingReturns();
  }, [account])

  useEffect(() => {
  },[nfts])


  if (chainId == 5) {
    if (loading) return (
      <main style={{ padding: "1rem 0" }}>
        <h2>Loading...</h2>
      </main>
    )
  }




return (
    <div className="flex justify-center">
      
      <div>
        <Button onClick={() => withdraw(account)} style={{ marginLeft: "1000px", marginTop: "5px" }} disabled={Bid || load}> Return Bids </Button>
      </div>
      {nfts.length > 0 ?
        <div className="px-5 container">
          <Row xs={1} md={2} lg={3} className="g-4 py-5">
            {nfts.map((item,idx) => (


      <MintedBox item={item} idx={idx} loading={load} NFTAbi={NFTAbi} signers={signers} marketplace={marketplace} account={account} />
      ))}

          </Row>

        </div>


        : (
          <main style={{ padding: "1rem 0" }}>
            <h2>No purchases</h2>
            <div>
            </div>
          </main>
        )}
    </div>
  );
}