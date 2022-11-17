const {enter, walk} = require('../lib');
const {BigNumber, utils, providers} = require('ethers');
const webappConfig = require('../../webapp/src/data/config');
require('dotenv').config()

module.exports = async ({getNamedAccounts, getChainId}) => {
  const provider = new providers.JsonRpcProvider(process.env.PROVIDER_ENDPOINT);
  const gasPrice = provider.getGasPrice().then(price => { return parseInt(utils.formatUnits(price, "wei")).toString(); })
  const chainId = process.env.CHAIN_ID; //await getChainId(); //Old method replaced with env.
  const config = webappConfig(chainId);
  const explore = Number(process.env.EXPLORE);
  const {deployer} = await getNamedAccounts();
  const setup = await enter(deployer, config.price, gasPrice);
  setup.opts = {gasPrice};
  console.log('walker is exploring');
  const rooms = await walk(setup, explore);
  console.log('walker finished after ' + Object.keys(rooms).length + ' rooms');
};

module.exports.skip = async () => !process.env.EXPLORE;
