import React from 'react';
import { StakingContract, StakingAPI, NETWORK_TYPE } from "harmony-staking-sdk";
import { getChainsConfig, getBalances, proposeTransaction, getTransactionQueue, setBaseUrl, type ChainListResponse } from '@safe-global/safe-gateway-typescript-sdk'
import Web3 from "web3";
import './App.css';

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
  proposeTransaction: () => {
    proposeTransaction()
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
