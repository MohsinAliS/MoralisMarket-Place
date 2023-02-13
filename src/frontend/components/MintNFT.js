import { useEffect, useState } from 'react'
import { Row, Form, Button } from 'react-bootstrap'
import { uploadFileToIPFS, uploadJSONToIPFS } from "./pinata";
import {useNavigate} from "react-router-dom";
import { messagePrefix } from '@ethersproject/hash';
import { ethers } from 'ethers';



const Create = ({ nft }) => {
  const [image, setImage] = useState('')
  const [royality, setRoyality] = useState()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [chainId,setChainId] = useState()
  const navigate = useNavigate();

  const getChainId = ()=> {
    const id = Number(window.ethereum.chainId)
    setChainId(id)
  }

  async function OnChangeFile(e) {
    var file = e.target.files[0];

  
    if (typeof file !== 'undefined') {
      try {
        setLoading(true)
        const resut = await uploadFileToIPFS(file);
        //const result = await client.add(file)    
        setImage(resut.pinataURL);
        setLoading(false)
      } catch (error) {
        setLoading(false)
        console.log("ipfs image upload error: ", error)
      }
    }
  }


  const createNFT = async () => {


    if (!image || !name || !description) return
    //let temp = image.("https://gateway.pinata.cloud/ipfs/").replace("https://gateway.pinata.cloud/ipfs/");
    const nftJSON = {
      "attributes":[
      {"trait_type":`${name}`,"value":"Testing"},
      {"trait_type":"First","value":"Onwer"},
      {"trait_type":"NFT","value":"Developer"},
      {"trait_type":"Web3","value":"FullStack"}],
      "description":`${description}`,
      "image":`${image}`,
      "name":`${name}`
    }


    try {
      setLoading(true)
      const result = await uploadJSONToIPFS(nftJSON)
     console.log("this is json image format ",result);
     await mintThenList(result)
     setName("")
     setDescription("")
     setRoyality("")
     navigate('/my-purchases')
      setLoading(false)
    } catch (error) {
      setLoading(false)

      console.log("ipfs uri upload error: ", error)
    }
  }

  const mintThenList = async (result) => {
    try {
      setLoading(true)
 
      await (await nft.mint(result.pinataURL,royality)).wait()

    } catch (error) {
      setLoading(false)

      console.log(error)
    }
  }

  useEffect(()=>{
    getChainId()
  },[])
  return (
    <div className="container-fluid mt-5">
    {(
    //chainId == "31337"
   chainId == "5"
    ?
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={OnChangeFile}
                disabled = {loading}
              />
              <Form.Control onChange={(e) => setName(e.target.value)} size="lg" value={name} required type="text" placeholder="Name" disabled = {loading} />
              <Form.Control onChange={(e) => setDescription(e.target.value)} size="lg" value={description} required as="textarea" placeholder="Description" disabled = {loading} />
              <Form.Control onChange={(e) => setRoyality(e.target.value)} size="lg" required type="number" value={royality} placeholder="Royality Fees in %" disabled = {loading} />
              <div className="d-grid px-0">
                <Button onClick={createNFT} disabled = {loading} variant="primary" size="lg">
                  Create & List NFT!
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>

      :
"Please switch to supported network"

)}
    
    </div>
  );
}

export default Create