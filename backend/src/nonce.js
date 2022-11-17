const ethers = require('ethers');
const provider = new ethers.providers.JsonRpcProvider("https://patient-yolo-wave.avalanche-testnet.discover.quiknode.pro/896a4076ea14a0f32ac6c99ff1488cec1672bb2b/ext/bc/C/rpc");

provider.getTransactionCount("0x0d83075fd78bF0989E8B0b4Cc399A66C7899037C").then((value) => {
console.log(value);})

provider.getGasPrice().then(value => {console.log(ethers.utils.formatUnits(value, "wei"))} )

provider.getLogs({
    fromBlock: 15339000,
    toBlock: (15339000+2048),
    address: "0x91a65B86D8Bd34925811dCc3F7E583F5a7eD8FfC",
    topics: ["0xa97399cd19a5b00b49b7d10d188180e100139a0501c9c9b4fe21dab5b915162f","0x8000000000000000000000000000000000000000000000000000000000000000"],
  }).then(logs => console.log(logs))