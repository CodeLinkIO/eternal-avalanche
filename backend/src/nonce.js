const ethers = require('ethers');
const provider = new ethers.providers.JsonRpcProvider("https://patient-yolo-wave.avalanche-testnet.discover.quiknode.pro/896a4076ea14a0f32ac6c99ff1488cec1672bb2b/ext/bc/C/rpc");

provider.getTransactionCount("0x0d83075fd78bF0989E8B0b4Cc399A66C7899037C").then((value) => {
    console.log(value);})