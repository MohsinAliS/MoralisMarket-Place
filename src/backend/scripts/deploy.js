const { ethers, hre, artifacts } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  
  // Get the ContractFactories and Signers here.
  const NFT = await ethers.getContractFactory("NFT");
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const token = await ethers.getContractFactory("Token");

  // deploy contracts
  const nft = await NFT.deploy();
  const Token = await token.deploy();
  const marketplace = await Marketplace.deploy(deployer.address,Token.address);

  console.log(
    "NFTContracts",nft.address
  ); 
  
  console.log(
    "Marketplace",marketplace.address
  );
  console.log(
    "Token",Token.address
  );
 
  


  //   ////contract verify scripts ///////////////////
  // await nft.deployTransaction.wait(5);

  // await hre.run(`verify:verify`, {
  //   address: nft.address,
  //   constructorArguments: []
  // });


  //   ////contract verify scripts ///////////////////
  // await Token.deployTransaction.wait(5);

  // await hre.run(`verify:verify`, {
  //   address: Token.address,
  //   constructorArguments: []
  // });

  //   ////contract verify scripts ///////////////////
  //   await marketplace.deployTransaction.wait(5);

  //   await hre.run(`verify:verify`, {
  //     address: marketplace.address,
  //     constructorArguments: [deployer.address,Token.address]
  //   });


  // Save copies of each contracts abi and address to the frontend.
  saveFrontendFiles(marketplace , "Marketplace");
  saveFrontendFiles(nft , "NFT");
  saveFrontendFiles(Token , "Token");

}

function saveFrontendFiles(contract, name) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../../frontend/contractsData";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + `/${name}-address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2)
  );

  const contractArtifact = artifacts.readArtifactSync(name);
  fs.writeFileSync(
    contractsDir + `/${name}.json`,
    JSON.stringify(contractArtifact, null, 2)
  );
}
///0x83864f0E2841a94105176E9d6a9d265a4C9bb607 NFTContracts
//0x2cEf418A8DA452f1297b322ec3e61adf917c0608 Marketplace
//0xBEcBDF8c530DEe0bed00c887408160520380A4aB Token

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
