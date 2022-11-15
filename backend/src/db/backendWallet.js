const { Wallet, utils, BigNumber } = require('ethers');
const retry = require('p-retry');

const { fromMnemonic } = utils.HDNode;

class BackendWallet extends Wallet {
  constructor(...args) {
    super(...args);
  }

  connect(provider) {
    // @TODO: catch same errors
    super.connect(provider);
    return new BackendWallet(this.privateKey, provider);
  }

  async sendTransaction(transaction) {
    if (transaction.gasPrice == null) {
      transaction.gasPrice = BigNumber.from(process.env.GAS_PRICE || '1000000000');
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
          console.log(`Error. Trying again.${err_arr[err_arr.length - 2]} ${process.env.GAS_PRICE}`);
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
