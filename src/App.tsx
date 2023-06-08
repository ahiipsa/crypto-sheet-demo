import React from 'react';
import { StakingAPI, NETWORK_TYPE } from "harmony-staking-sdk";
import { getChainsConfig, getBalances, setBaseUrl } from '@safe-global/safe-gateway-typescript-sdk'
import Web3 from "web3";
import Safe, {EthSafeSignature, Web3Adapter} from '@safe-global/protocol-kit'
import './App.css';
import {MetaTransactionData, SafeTransactionDataPartial} from "@safe-global/safe-core-sdk-types";
import {StakingContract} from "./staking/contract";
import {MultisigTransactionRequest} from "@safe-global/safe-gateway-typescript-sdk/dist/types/transactions";
import SafeApiKit from "@safe-global/api-kit";
import {adjustVInSignature} from "@safe-global/protocol-kit/dist/src/utils";


const SAFE_GATEWAY_URL = 'https://gateway.multisig.harmony.one'
const SAFE_TRANSACTION_URL = 'https://transaction.multisig.harmony.one'

setBaseUrl('https://gateway.multisig.harmony.one/')

export enum ACTION_TYPE {
  DELEGATION = 'DELEGATION',
  UNDELEGATION = 'UNDELEGATION',
}

const stakingApi = new StakingAPI({
  apiUrl: "https://api.stake.hmny.io",
});

// @ts-ignore
const web3 = new Web3(window.ethereum);


const stakingContract = new StakingContract({
  provider: web3.currentProvider as any,
});

const lib = {
  getDelegations: async (address: string, validatorAddress: string) => {
    const delegations = await stakingApi.fetchDelegationsByAddress(
      NETWORK_TYPE.MAINNET,
      address
    );

    return delegations.find(d => {
      if (d.validatorAddress === validatorAddress) {
        console.log('### d', d);
        console.log('### String(d.delegationAmount)', String(d.delegationAmount));
        return d;
      }
      return  false
    })
  },
  collectRewards: async() => {
      return stakingContract.collectRewards((txHash) => {
        console.log('### txHash', txHash);
      })
  },
  delegate: async (validatorAddress: string, amount: string) => {
    const tx = await stakingContract.delegate(
      validatorAddress,
      amount,
      (txHash) => {
        // setLoading(false);
        console.log('### txHash', txHash);
      }
    );
  },
  undeledate: async (validatorAddress: string, amount: string) => {
    const tx = await stakingContract.unDelegate(
      validatorAddress,
      amount,
      (txHash) => {
        // setLoading(false);
        console.log('### txHash', txHash);
      }
    );
  },
  safeGetBalances: async (safeAddress: string) => {
    return await getBalances('1666600000', safeAddress);
  },
  safeDelegate: async (senderAddress: string, validatorAddress: string, safeAddress: string, amount: string) => {
    const data = stakingContract.delegateEncodeABI(safeAddress, validatorAddress, amount);
    return lib.safeProposeTransaction(senderAddress, safeAddress, data);
  },

  safeUndelegate: async (senderAddress: string, validatorAddress: string, safeAddress: string, amount: string) => {
    const data = stakingContract.unDelegateEncodeABI(safeAddress, validatorAddress, amount);
    return lib.safeProposeTransaction(senderAddress, safeAddress, data);
  },

  safeCollectRewards: async (senderAddress: string, safeAddress: string) => {
      const data = stakingContract.collectRewardsEncodeABI(safeAddress);
      return lib.safeProposeTransaction(senderAddress, safeAddress, data);
  },


  async safeProposeTransaction(senderAddress: string, safeAddress: string, encodedAbi: any) {
    const _senderAddress = web3.utils.toChecksumAddress(senderAddress);

    const ethAdapter = new Web3Adapter({
      web3,
      signerAddress: _senderAddress
    })

    console.log('### _senderAddress', _senderAddress);

    const safeSdk = await Safe.create({ ethAdapter, safeAddress })

    const _contractAddress = web3.utils.toChecksumAddress(stakingContract.getContractAddress());
    const safeService = new SafeApiKit({ txServiceUrl: SAFE_TRANSACTION_URL, ethAdapter })
    const nonce = await safeService.getNextNonce(safeAddress)

    const safeTransactionData: SafeTransactionDataPartial = {
      to:_contractAddress,
      data: encodedAbi,
      value: '0',
      nonce: nonce,
    }

    const safeTransaction = await safeSdk.createTransaction({ safeTransactionData })

    const safeTxHash = await safeSdk.getTransactionHash(safeTransaction)
    // const senderSignature = await safeSdk.signTransactionHash(safeTxHash)

    const signature = await web3.eth.personal.sign(safeTxHash, _senderAddress, '');


    const vSignature = adjustVInSignature('eth_sign', signature, safeTxHash, _senderAddress)

    const senderSignature = new EthSafeSignature(_senderAddress, vSignature)

    await safeService.proposeTransaction({
      safeAddress,
      safeTransactionData: safeTransaction.data,
      safeTxHash,
      senderAddress: _senderAddress,
      senderSignature: senderSignature.data,
    })
  }
}

// @ts-ignore
window.hlib = lib;

function App() {
  return (
   null
  );
}

export default App;
