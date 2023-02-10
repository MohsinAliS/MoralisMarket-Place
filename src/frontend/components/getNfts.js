// import { useAccount } from "wagmi";
// import axios from "axios";
// import { useState, useEffect } from 'react';


// export default function getNfts() {
//   const [nfts, setNfts] = useState([]);
  
//   const { address } = useAccount();
//   const chain = "0x5";

//   useEffect(() => {
//     let response;
//     async function getData() {
//       response = await axios
//         .get(`http://localhost:5001/getnfts`, {
//           params: { address, chain },
//         })
//         .then((response) => {
//           setNfts(response.data.result);
//           console.log(response);
//         });
//     }
//     getData();
//   }, []);

//   return (
//     <div></div>
//     // <section >
//     //   {nfts.map((nft) => {
//     //     return nft.metadata;
//     //   })}
//     // </section>
//   );
// }
