import BN from 'bn.js';
import Web3 from 'web3';
import { EventEmitter } from 'events';
import { ContractABIs, bufferToBytes } from 'boltz-core';
import Logger from '../Logger';
import { EthereumConfig } from '../Config';
import { stringify, getHexString, etherDecimals, getGasPrice } from '../Utils';
import { EtherSwap } from '../../node_modules/boltz-core/types/web3/EtherSwap';
import { ERC20Swap } from '../../node_modules/boltz-core/types/web3/ERC20Swap';

class ContractHandler extends EventEmitter {
  public etherSwap: EtherSwap;
  public erc20Swap: ERC20Swap;

  constructor(
    private logger: Logger,
    private web3: Web3,
    private etherAddress: string,
    config: EthereumConfig,
  ) {
    super();

    if (config.etherSwapContract === '' || config.erc20SwapContract === '') {
      throw 'Invalid Ethereum contract configuration';
    }

    this.etherSwap = new this.web3.eth.Contract(ContractABIs.EtherSwapABI, config.etherSwapContract) as EtherSwap;
    this.erc20Swap = new this.web3.eth.Contract(ContractABIs.ERC20SwapABI, config.erc20SwapContract) as ERC20Swap;

    this.logger.info(`Initialized Ethereum swap contracts: ${stringify({
      etherSwap: config.etherSwapContract,
      erc20Swap: config.erc20SwapContract,
    })}`);
  }

  public lockupEther = async (preimageHash: Buffer, claimAddress: string, timeout: number, amount: number, gasPrice?: number) => {
    this.logger.debug(`Locking ${amount} Ether with preimage hash: ${getHexString(preimageHash)}`);

    return this.etherSwap.methods.create(bufferToBytes(preimageHash), claimAddress, timeout).send({
      from: this.etherAddress,
      gasPrice: await getGasPrice(this.web3, gasPrice),
      value: new BN(amount).mul(etherDecimals).toString(),
    });
  }

  public claimEther = async (preimageHash: Buffer, preimage: Buffer, gasPrice?: number) => {
    this.logger.debug(`Claming Ether swap ${getHexString(preimageHash)} with preimage: ${getHexString(preimage)}`);

    return this.etherSwap.methods.claim(bufferToBytes(preimageHash), bufferToBytes(preimage)).send({
      from: this.etherAddress,
      gasPrice: await getGasPrice(this.web3, gasPrice),
    });
  }

  public getEtherSwaps = (preimageHash: Buffer) => {
    return this.etherSwap.methods.swaps(bufferToBytes(preimageHash)).call();
  }
}

export default ContractHandler;
