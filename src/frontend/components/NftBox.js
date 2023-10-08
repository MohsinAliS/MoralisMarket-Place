import { ethers } from 'ethers'
import React, { useEffect, useState } from 'react'
import { Modal, ModalHeader, Form, ModalBody } from "reactstrap"
import { Row, Col, Card, Button } from 'react-bootstrap'
import Countdown from 'react-countdown'
import {useNavigate} from "react-router-dom";
import Token from "../contractsData/Token.json"
import TokenAddress from "../contractsData/Token-address.json"


const NftBox = ({ item, idx, marketplace, account, loading, setLoading }) => {
  const [modal, setmodal] = useState(false)
  const [offer, setOffer] = useState(false)
  const [price, setPrice] = useState(null)
  const [OfferPrice, setOfferPrice] = useState(null)
  const [Time, setTime] = useState(0)
  const [bid, setbid] = useState(0)
  const [bidder, setbidder] = useState(null)
  const [offerAmount,setofferAmount]= useState(0);
  const [NowTime, setNowTime] = useState(0)
  const navigate = useNavigate();

  const getLastTime = async () => {
    try {
      const time = await marketplace?.getLastTime(item?.itemId?.toString())
      const temp = Number(time?.toString())
      const nowDate = Math.floor((new Date()).getTime() / 1000);
      setTime(temp)
      setNowTime(nowDate)
    } catch (error) {
      console.log(error);
    }
  }

  const getHigestBid = async () => {
    try {
      let bid = await marketplace?.getHighestBid(item?.itemId);
      setbid(ethers.utils.formatEther(bid))
    } catch (error) {
      console.log(error);
    }
  }

  const getHigestBidder = async () => {
    try {
      let bidder = await marketplace?.getHighestBidder(item?.itemId);
      setbidder(bidder)
    } catch (error) {
      console.log(error);
    }

  }

  const CancelListing = async () => {
    try {
      setLoading(true)
     await (await marketplace?.cancelListing(item?.itemId)).wait();
      setLoading(false);
      navigate('/my-purchases');
    } catch (error) {
      setLoading(false);
      console.log(error);
    }


  }

  const concludeAuction = async () => {
    try {
      setLoading(true);
    await (await marketplace?.concludeAuction(item?.itemId, account)).wait();
      setLoading(false);
      navigate('/my-purchases')
    } catch (error) {
      setLoading(false);
      console.log(error);
    }

  }

  const cancellAuction = async () => {
    try {
      setLoading(true);
    await (await marketplace?.cancellAuction(item?.itemId, account)).wait();
      setLoading(false);
      navigate('/my-purchases')
    } catch (error) {
      setLoading(false);
      console.log(error);
    }

  }


  const buyMarketItem = async (item) => {
    try {
      setLoading(true)
      await (await marketplace.purchaseItem(item?.itemId.toString(), { value: item?.totalPrice })).wait()
      setLoading(false);
      navigate('/my-purchases')
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }


  const placeBid = async () => {
    try {
      setLoading(true);
       // get uri url from nft contract
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    // Set signer
    const signer = provider.getSigner()
    const token = new ethers.Contract(TokenAddress?.address, Token?.abi,signer)
    const bidding = ethers.utils.parseEther(price)
   
    const balance= await token.balanceOf(account);
    if(Number(balance)>=Number(bidding)){
      if(Number(bidding)>Number(bid)){
      await (await token.approve(marketplace?.address,bidding)).wait()
    
      console.log("item.itemId ", item?.itemId);
      await (await marketplace.bid(item?.itemId, bidding)).wait() 
      console.log("success ");

      setmodal(false);
      setLoading(false);
      window.location.reload()}
    else{
      alert("please Increase Your Bid")
    }}
      else {
        alert("You Dont Have Balance")
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  }

  function getData(val) {
    setPrice(val.target.value)
  }

  function getOffer(val) {
    setOfferPrice(val.target.value)
  }

  const makeOffers = async(item)=>{
  try {
    // get uri url from nft contract
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    // Set signer
    const signer = provider.getSigner()
    const token = new ethers.Contract(TokenAddress?.address, Token?.abi,signer)
    const offer = ethers.utils.parseEther(OfferPrice);
    const balance= await token.balanceOf(account);
    if(Number(balance)>=Number(offer)){
      if(Number(offer)>Number(offerAmount.amount)){
    await (await token.approve(marketplace?.address,offer));
    await (await marketplace.makeOffer(item?.itemId,offer));
  }
  else{
    alert("please increse you offer");
  }
    
 } else {
      alert("You Dont Have Balance");
    }
  }catch (error) {
    console.log("this is makeOffers error");
  }
  }

  const itemOffer =async()=>{
    try {
     const offers =  await marketplace?.makeoffer(item?.itemId);
     setofferAmount(offers);
      
    } catch (error) {
      console.log("this is itemOffer error");
    }
  }
  
  
  
  
  const acceptOffer=async(item)=>{
  try {
    await(await marketplace?.acceptOffer(item?.itemId));
  } catch (error) {
    console.log("this is error")
    
  }

  }




  useEffect(() => {
    getLastTime();
    getHigestBid();
    getHigestBidder();
  },[bidder,bid]);

  
  useEffect(()=>{
    itemOffer();
  },[]);

  return (
    <>
      <Col lg={4} key={idx} className="overflow-hidden">
        <Card>
          <Card.Img variant="top" src={item?.image} />
          <Card.Body color="secondary">
            <Card.Title>{item.name}</Card.Title>
            <hr />
            <Card.Text>
              {item.description}
            </Card.Text>

            <hr />
            <Card.Text>
              {`Owned By :  ${item?.seller?.slice(0, 5)}...${item?.seller?.slice(item?.seller?.length - 4)}`}
            </Card.Text>
            
            <hr />
            {item.time > 0 ?
            <Card.Text>
              {`Initial Price : ${ethers?.utils?.formatEther(item?.totalPrice?.toString())} ETH`} 
            </Card.Text>
           : 
           <Card.Text>
              {`Price : ${ethers?.utils?.formatEther(item?.totalPrice?.toString())} ETH`} 
            </Card.Text>
            } 
            <div> 
            <Card.Text>
              {`Royality Fees : ${item?.Royality?.toString()} %`}
            </Card.Text>
 
            { item?.time > 0 ?         
             <div> <Card.Text>
              {`Highest Bid : ${bid} ETH`}
            </Card.Text>
            <Card.Text>
              {`Highest Bidder : ${bidder?.slice(0, 5)}...${bidder?.slice(bidder?.length - 4)}`}
            </Card.Text>
            </div>
            : 
           <></> }
            </div>
            <div>
              {offerAmount?.amount > 0 ?
              <div style={{marginTop:"5px"}} > 
              <Card.Text>
              {/* {`Offer : ${ethers?.utils?.formatEther(offerAmount?.amount?.toString())}`} */}
              {`Offer : ${offerAmount?.amount} `}
            </Card.Text> 
            </div>
            :
            <>
            </>
            }
            
            </div>
            
              
          </Card.Body>
          <Card.Footer>
            <div className='d-grid'>
              {item?.time > 0
                ?
                NowTime < Time
                  ? 
                  account?.toString()?.toLowerCase() === item?.seller?.toString()?.toLowerCase()
                  ?
                  <div className='d-grid'>
                    <Countdown date={Time * 1000} />
                    <Button variant="primary" size="lg" disabled={true} > Auction is in progress </Button> 
                    </div>
                    :
                    <div className='d-grid'>
                          <Countdown date={Time * 1000} />
                          <hr />
                    <Button onClick={() => setmodal(true)} variant="primary" size="lg" disabled={loading} > Place Bid </Button>
                        </div>
                  :
                  bid > 0 && bidder?.toString()?.toLowerCase() === account?.toString()?.toLowerCase()
                  ? 
                  <div className='d-grid'>
                    <Button onClick={() => concludeAuction()} variant="primary" size="lg" disabled={loading} > GET NFT </Button> 
                  </div>
                   : 
                 account?.toString()?.toLowerCase() !== item.seller?.toString()?.toLowerCase()
                 ? <div className='d-grid'>
                 <Button variant="primary" size="lg" disabled={true} > Auction has Ended </Button> 
               </div>
               
               :bid>0 ?
                  <div className='d-grid'>
                   <Button variant="primary" size="lg" disabled={true} > Auction has Ended </Button> 
                 </div>
                :
                <div className='d-grid'>
                <Button onClick={() => cancellAuction()} variant="primary" size="lg" disabled={loading} > Take your NFT </Button> 
              </div>
                  
                : account?.toString()?.toLowerCase() === item?.seller?.toString()?.toLowerCase()
                  ? <>
                  <div className='d-grid'>
                  <Button onClick={() => CancelListing(item)} variant="primary" size="lg" disabled={loading}>
                    Cancel Listing
                  </Button>
                  </div>
                  {
                    offerAmount?.amount > 0
                    ?<div style={{marginTop:"10px"}} className='d-grid'>
                    <Button onClick={() => acceptOffer(item)} variant="primary" size="lg" disabled={loading}>
                    Accept Offer
                  </Button>
                  </div>
                  :<></>
                  }
                  </>
                  : <>   
                  <div className='d-grid'>
                  <Button  onClick={() => buyMarketItem(item)} variant="primary" size="lg" disabled={loading}>
                    Buy NFT
                  </Button>
                  </div>
                  <div className='d-grid' style={{marginTop:"10px"}}>
                   <Button onClick={() => setOffer(true)}  variant="secondary"  size="lg" disabled={loading}>
                   Make Offer
                 </Button>
                 </div>
                 </>
              }

            </div>
          </Card.Footer>
        </Card>
      </Col>


      <Modal
        size='lg'
        isOpen={modal}
        toggle={() => setmodal(!modal)}>
        <ModalHeader
          toggle={() => setmodal(!modal)}>
          Place Bid
        </ModalHeader>
        <ModalBody>
          <Form >
            <Row>
              <div>
                <input
                  required type="number"
                  className='form-control'
                  placeholder='Enter Bid'
                  onChange={getData}></input>
              </div>
              <div>
                <Button onClick={() => placeBid(item?.itemId)} style={{ marginLeft: "200px", marginTop: "10px" }}> Submit </Button>
              </div>
            </Row>
          </Form>
        </ModalBody>
      </Modal>

      
      
      <Modal
        size='lg'
        isOpen={offer}
        toggle={() => setOffer(!offer)}>
        <ModalHeader
          toggle={() => setOffer(!offer)}>
          Make Offer
        </ModalHeader>
        <ModalBody>
          <Form >
            <Row>
              <div>
                <input
                  required type="number"
                  className='form-control'
                  placeholder='Enter Offer'
                  onChange={getOffer}></input>
              </div>
              <div>
                <Button onClick={() => makeOffers(item)} style={{ marginLeft: "200px", marginTop: "10px" }}> Submit </Button>
              </div>
            </Row>
          </Form>
        </ModalBody>
      </Modal>

    </>


  )
}

export default NftBox