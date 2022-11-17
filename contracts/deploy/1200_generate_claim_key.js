const qrcode = require('qrcode');
const {Wallet, BigNumber, utils, providers} = require('ethers');
const fs = require('fs');
const webappConfig = require('../../webapp/src/data/config');
require('dotenv').config()

module.exports = async ({network, getChainId, getNamedAccounts, deployments}) => {
  const provider = new providers.JsonRpcProvider(process.env.PROVIDER_ENDPOINT);
  const gasPrice = provider.getGasPrice().then(price => { return utils.formatUnits(price, "wei"); })
  const {execute, deployIfDifferent, log} = deployments;
  const chainId = process.env.CHAIN_ID; //await getChainId(); //Old method replaced with env.
  const config = webappConfig(chainId); // TODO contract expose min balance / price
  const gas = 6000000;

  if (network.live && process.env.GENERATE_KEYS === "0") {
    log('skip deployment chain, require manual intervention');
    return;
  }
  const dev_forceMine = true;

  let offset = 0;
  let mnemonic = 'poet state twin chunk pottery boss final sudden matter express nasty control'; // keep old claimKey for local
  if (network.live) {
    offset = 3200;
    mnemonic = process.env.MNEMONIC;
  }

  const {deployer} = await getNamedAccounts();
  let numClaimKey = parseInt(process.env.KEYS_TO_GENERATE);

  const random = false; // false
  const claimKeys = [];
  const price = BigNumber.from(config.price);
  const claimKeyValue = price.mul(5); // ~< 5 refill

  const result = await deployIfDifferent(['data'], 'Batch', {from: deployer, gas, gasPrice, dev_forceMine}, 'Batch');
  if (!result.newlyDeployed) {
    log('reusing Batch contract');
  }
  log('sending from', deployer);
  const addresses = [];
  let totalValue = BigNumber.from(0);
  for (let i = offset; i < numClaimKey + offset; i++) {
    let wallet;
    if (random) {
      wallet = Wallet.createRandom();
    } else {
      let path = "m/44'/60'/" + i + "'/0/0";
      wallet = Wallet.fromMnemonic(mnemonic, path);
    }
    claimKeys.push(wallet.privateKey);
    addresses.push(wallet.address);
    totalValue = totalValue.add(claimKeyValue);
  }
  log(`sending ${claimKeyValue.toString()} to each of the ${numClaimKey} claimKeys...`);
  await execute(
    'Batch',
    {from: deployer, value: totalValue.toString(), gas: 6000000, dev_forceMine},
    'transfer',
    addresses,
  );
  fs.writeFileSync('.claimKeys', JSON.stringify(claimKeys, null, 2));
  var csv = 'key,qrURL,url,used\n';
  for (const claimKey of claimKeys) {
    const url = 'https://alpha.ethernal.world/#dungeonKey=' + claimKey;
    const qrURL = await qrcode.toDataURL(url);
    csv += claimKey + ',"' + qrURL + '",' + url + ',false ' + '\n';
  }
  fs.writeFileSync('.claimKeys.csv', csv);
  log(`${numClaimKey} generated in .claimKeys and .claimKeys.csv`);
};
module.exports.tags = ['ClaimKeys'];
