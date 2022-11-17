const { Wallet, utils, BigNumber, providers } = require('ethers');
const retry = require('p-retry');
const { fromMnemonic } = utils.HDNode;

require("dotenv").config()

class BackendWallet extends Wallet {
  constructor(...args) {
    super(...args);
    const provider = new providers.JsonRpcProvider(process.env.PROVIDER_ENDPOINT);
    this.price = 0;
    provider.getGasPrice().then(price => { this.price = parseInt(utils.formatUnits(price, "wei")); })
  }

  connect(provider) {
    // @TODO: catch same errors
    super.connect(provider);
    return new BackendWallet(this.privateKey, provider);
  }

  async sendTransaction(transaction) {
    if (transaction.gasPrice == null) {
      transaction.gasPrice = this.price;
      transaction.gasLimit = parseInt(process.env.GAS_LIMIT);
    }
    if (transaction.nonce == null) {
      try {
        transaction.nonce = this.provider.getTransactionCount(this.address);
        transaction.nonce.then(nonce => transaction.nonce = nonce);
      } catch (err) {
        throw `There was an error while getting the transaction count.\n${err}`
      }
    }

    const tx = await retry(async () => {
      let tx;
      try {
        tx = await super.sendTransaction(transaction);
      } catch (err) {
        //This is not the correct way. A proper error message will always contain "nonce".
        if (err.message.includes('nonce')) {
          let err_arr = err.message.split(",") 
          console.log(`Error. Trying again.${err_arr[err_arr.length - 2]}`);
          console.log(transaction)
          transaction.nonce = await this.provider.getTransactionCount(this.address);
          tx = await super.sendTransaction(transaction);
        } else {
          throw err;
        }
      }
      return tx;
    });
    return tx;
  }

  static fromMnemonic(mnemonic, path = "m/44'/60'/0'/0/0", wordlist) {
    return new BackendWallet(fromMnemonic(mnemonic, wordlist).derivePath(path));
  }

  // @TODO static fromEncryptedJson
}

module.exports = BackendWallet;
