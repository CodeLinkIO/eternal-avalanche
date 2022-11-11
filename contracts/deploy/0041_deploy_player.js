const webappConfig = require('../../webapp/src/data/config');
require('dotenv').config()

module.exports = async ({ethers, deployments, getChainId, network, getNamedAccounts}) => {
  const chainId = process.env.CHAIN_ID; //await getChainId(); //Old method replaced with env.
  const config = webappConfig(chainId); // TODO contract expose min balance / price
  const dev_forceMine = !network.live;
  const {deploy} = deployments;
  const {deployer, dungeonOwner} = await getNamedAccounts();

  const charactersContract = await ethers.getContract('Characters');
  const ubfContract = await ethers.getContract('UBF');

  await deploy('Player', {
    from: network.live ? deployer : dungeonOwner,
    dev_forceMine,
    proxy: 'postUpgrade',
    args: [
      charactersContract.address,
      dungeonOwner, /// feeReceipient
      config.minBalance,
      ubfContract.address,
    ],
    log: true,
  });
};
