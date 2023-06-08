import React from 'react';
import { StakingAPI, NETWORK_TYPE } from "harmony-staking-sdk";
import { getChainsConfig, getBalances, setBaseUrl } from '@safe-global/safe-gateway-typescript-sdk'
import Web3 from "web3";
import Safe, { Web3Adapter } from '@safe-global/protocol-kit'
import './App.css';
import {MetaTransactionData, SafeTransactionDataPartial} from "@safe-global/safe-core-sdk-types";
import {StakingContract} from "./staking/contract";
import {MultisigTransactionRequest} from "@safe-global/safe-gateway-typescript-sdk/dist/types/transactions";
import SafeApiKit from "@safe-global/api-kit";


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

const ethAdapter = new Web3Adapter({
  web3,
  signerAddress: '0xCBB2CDFa7551650B767f12527D54B221176E26a8'
})

const safeAddress = '0x3Fb8cFB3EAeE90E26B3eC8136eF6E90696CFD1DD'
const validatorAddress = '0xe05941d0919d058cfbb173655178201721002dbb'

console.log('### SafeApiKit', SafeApiKit);
const safeService = new SafeApiKit({ txServiceUrl: SAFE_TRANSACTION_URL, ethAdapter })

// @ts-ignore
window.ss = safeService;

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
    const safeSdk = await Safe.create({ ethAdapter, safeAddress })
    const data = stakingContract.delegateEncodeABI(safeAddress, validatorAddress, amount);

    const checksummedAddress = web3.utils.toChecksumAddress(stakingContract.getContractAddress());

    const safeTransactionData: SafeTransactionDataPartial = {
      to:checksummedAddress,
      data,
      value: '0',
    }

    const safeTransaction = await safeSdk.createTransaction({ safeTransactionData })

    const safeTxHash = await safeSdk.getTransactionHash(safeTransaction)
    const senderSignature = await safeSdk.signTransactionHash(safeTxHash)
    await safeService.proposeTransaction({
      safeAddress,
      safeTransactionData: safeTransaction.data,
      safeTxHash,
      senderAddress,
      senderSignature: senderSignature.data,
    })
  },

  safeUndelegate: async (senderAddress: string, validatorAddress: string, safeAddress: string, amount: string) => {
    const safeSdk = await Safe.create({ ethAdapter, safeAddress })
    const data = stakingContract.unDelegateEncodeABI(safeAddress, validatorAddress, amount);

    const checksummedAddress = web3.utils.toChecksumAddress(stakingContract.getContractAddress());

    const safeTransactionData: SafeTransactionDataPartial = {
      to:checksummedAddress,
      data,
      value: '0',
    }

    const safeTransaction = await safeSdk.createTransaction({ safeTransactionData })

    const safeTxHash = await safeSdk.getTransactionHash(safeTransaction)
    const senderSignature = await safeSdk.signTransactionHash(safeTxHash)
    await safeService.proposeTransaction({
      safeAddress,
      safeTransactionData: safeTransaction.data,
      safeTxHash,
      senderAddress,
      senderSignature: senderSignature.data,
    })
  },

  safeCollectRewards: async (senderAddress: string, safeAddress: string) => {
    const safeSdk = await Safe.create({ ethAdapter, safeAddress })
    const data = stakingContract.collectRewardsEncodeABI(safeAddress);

    const checksummedAddress = web3.utils.toChecksumAddress(stakingContract.getContractAddress());

    const safeTransactionData: SafeTransactionDataPartial = {
      to:checksummedAddress,
      data,
      value: '0',
    }

    const safeTransaction = await safeSdk.createTransaction({ safeTransactionData })

    const safeTxHash = await safeSdk.getTransactionHash(safeTransaction)
    const senderSignature = await safeSdk.signTransactionHash(safeTxHash)
    await safeService.proposeTransaction({
      safeAddress,
      safeTransactionData: safeTransaction.data,
      safeTxHash,
      senderAddress,
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
