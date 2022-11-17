const ethers = require('ethers');
require("dotenv").config()

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_ENDPOINT);

provider.getTransactionCount("0x0d83075fd78bF0989E8B0b4Cc399A66C7899037C").then((value) => {
console.log(value);})

provider.getGasPrice().then(value => {console.log(ethers.utils.formatUnits(value, "wei"))} )

provider.getLogs({
    fromBlock: parseInt(process.env.START_BLOCK),
    toBlock: (parseInt(process.env.START_BLOCK),+2048),
    address: "0x247702a74EEDb7B86C88EBa590AAb08802A9F2D5",
    topics: ["0xa97399cd19a5b00b49b7d10d188180e100139a0501c9c9b4fe21dab5b915162f","0x8000000000000000000000000000000000000000000000000000000000000000"],
  }).then(logs => console.log(logs))
  
provider.getNetwork().then( network => { console.log(network); } )