import { BNBChain } from '@xchainjs/xchain-binance'
import { AssetBTC, BTCChain } from '@xchainjs/xchain-bitcoin'
import { AssetATOM, COSMOS_DECIMAL } from '@xchainjs/xchain-cosmos'
import { AssetETH, ETHChain, ETH_GAS_ASSET_DECIMAL } from '@xchainjs/xchain-ethereum'
import { AssetRuneNative, THORChain } from '@xchainjs/xchain-thorchain'
import {
  AddliquidityPosition,
  CryptoAmount,
  LiquidityPosition,
  ThorchainQuery,
  WithdrawLiquidityPosition,
} from '@xchainjs/xchain-thorchain-query'
import { assetAmount, assetFromStringEx, assetToBase } from '@xchainjs/xchain-util'

import { ThorchainAMM } from '../src/thorchain-amm'
import { Wallet } from '../src/wallet'

const thorchainQueryMainnet = new ThorchainQuery()
const mainnetWallet = new Wallet(process.env.MAINNET_PHRASE || 'you forgot to set the phrase', thorchainQueryMainnet)
const mainetThorchainAmm = new ThorchainAMM(thorchainQueryMainnet)

// mainnet asset
const BUSD = assetFromStringEx('BNB.BUSD-BD1')

function printliquidityPosition(liquidityPosition: LiquidityPosition) {
  const expanded = {
    assetPool: liquidityPosition.position.asset,
    assetAmount: liquidityPosition.position.asset_deposit_value,
    runeAmount: liquidityPosition.position.rune_deposit_value,
    impermanentLossProtection: {
      ILProtection: liquidityPosition.impermanentLossProtection.ILProtection.formatedAssetString(),
      totalDays: liquidityPosition.impermanentLossProtection.totalDays,
    },
  }
  console.log(expanded)
}

// Test User Functions - single and double swap using mock pool data
describe('Thorchain-amm liquidity action end to end Tests', () => {
  // Check liquidity position
  it(`Should check liquidity position`, async () => {
    const busdAddress = await mainnetWallet.clients[THORChain].getAddressAsync()
    const lpPositon = await thorchainQueryMainnet.checkLiquidityPosition(BUSD, busdAddress)
    printliquidityPosition(lpPositon)
  })
  // Add liquidity positions
  it(`Should add BUSD liquidity asymmetrically to BUSD pool `, async () => {
    const hash = await mainetThorchainAmm.addLiquidityPosition(mainnetWallet, {
      asset: new CryptoAmount(assetToBase(assetAmount(2)), BUSD),
      rune: new CryptoAmount(assetToBase(assetAmount(0)), AssetRuneNative),
    })

    console.log(hash)
    expect(hash).toBeTruthy()
  })
  // Add liquidity positions
  it(`Should add Atom liquidity asymmetrically to Atom pool `, async () => {
    const hash = await mainetThorchainAmm.addLiquidityPosition(mainnetWallet, {
      asset: new CryptoAmount(assetToBase(assetAmount(0.1, COSMOS_DECIMAL)), AssetATOM),
      rune: new CryptoAmount(assetToBase(assetAmount(0)), AssetRuneNative),
    })

    console.log(hash)
    expect(hash).toBeTruthy()
  })
  it(`Should add ETH liquidity asymmetrically to ETH pool `, async () => {
    const addLPparams: AddliquidityPosition = {
      asset: new CryptoAmount(assetToBase(assetAmount(1.5, ETH_GAS_ASSET_DECIMAL)), AssetETH),
      rune: new CryptoAmount(assetToBase(assetAmount(0)), AssetRuneNative),
    }
    const hash = await mainetThorchainAmm.addLiquidityPosition(mainnetWallet, addLPparams)

    console.log(hash)
    expect(hash).toBeTruthy()
  })
  it(`Should add BTC liquidity asymmetrically to BTC pool `, async () => {
    const addLPparams: AddliquidityPosition = {
      asset: new CryptoAmount(assetToBase(assetAmount(0.009)), AssetBTC),
      rune: new CryptoAmount(assetToBase(assetAmount(0)), AssetRuneNative),
    }
    const hash = await mainetThorchainAmm.addLiquidityPosition(mainnetWallet, addLPparams)

    console.log(hash)
    expect(hash).toBeTruthy()
  })
  it(`Should add RUNE liquidity asymmetrically to BUSD pool `, async () => {
    const addLPparams: AddliquidityPosition = {
      asset: new CryptoAmount(assetToBase(assetAmount(0)), BUSD),
      rune: new CryptoAmount(assetToBase(assetAmount(1.19997)), AssetRuneNative),
    }
    const hash = await mainetThorchainAmm.addLiquidityPosition(mainnetWallet, addLPparams)
    console.log(hash)
    expect(hash).toBeTruthy()
  })
  it(`Should add BUSD & RUNE liquidity symmetrically to BUSD pool`, async () => {
    const poolRatio = await thorchainQueryMainnet.getPoolRatios(BUSD)
    // get ratios for pool and retrieve rune amount
    const busdtAmount = poolRatio.assetToRune.times(3)
    const runeAmount = poolRatio.runeToAsset.times(busdtAmount)
    const hash = await mainetThorchainAmm.addLiquidityPosition(mainnetWallet, {
      asset: new CryptoAmount(assetToBase(assetAmount(busdtAmount)), BUSD),
      rune: new CryptoAmount(assetToBase(assetAmount(runeAmount)), AssetRuneNative),
    })

    console.log(hash)
    expect(hash).toBeTruthy()
  })
  // Remove Liquidity Positions
  it(`Should remove BUSD only liquidity asymmetrically from the BUSD pool `, async () => {
    const percentage = 100 // gets converted to basis points later
    const removeLp: WithdrawLiquidityPosition = {
      percentage: percentage,
      asset: BUSD,
      assetAddress: await mainnetWallet.clients[BNBChain].getAddressAsync(),
    }
    const hash = await mainetThorchainAmm.withdrawLiquidityPosition(mainnetWallet, removeLp)
    console.log(hash)
    expect(hash).toBeTruthy()
  })
  it(`Should remove Rune liquidity asymetrically from the BUSD pool`, async () => {
    const percentage = 100 // gets converted to basis points later
    const removeLp: WithdrawLiquidityPosition = {
      percentage: percentage,
      asset: BUSD,
      runeAddress: await mainnetWallet.clients[THORChain].getAddressAsync(),
    }
    const hash = await mainetThorchainAmm.withdrawLiquidityPosition(mainnetWallet, removeLp)
    console.log(hash)
    expect(hash).toBeTruthy()
  })
  it(`Should remove BUSDT & RUNE symmetrically from symmetrical lp`, async () => {
    const percentage = 100 // gets converted to basis points later
    const removeLp: WithdrawLiquidityPosition = {
      percentage: percentage,
      asset: BUSD,
      assetAddress: await mainnetWallet.clients[BUSD.chain].getAddressAsync(),
      runeAddress: await mainnetWallet.clients[THORChain].getAddressAsync(),
    }
    const hash = await mainetThorchainAmm.withdrawLiquidityPosition(mainnetWallet, removeLp)
    console.log(hash)
    expect(hash).toBeTruthy()
  })
  it(`Should remove ETH liquidity asymetrically from the ETH pool`, async () => {
    const percentage = 100 // gets converted to basis points later
    const removeLp: WithdrawLiquidityPosition = {
      percentage: percentage,
      asset: AssetETH,
      assetAddress: await mainnetWallet.clients[ETHChain].getAddressAsync(),
    }
    const hash = await mainetThorchainAmm.withdrawLiquidityPosition(mainnetWallet, removeLp)
    console.log(hash)
    expect(hash).toBeTruthy()
  })
  it(`Should remove BTC liquidity asymetrically from the BTC pool`, async () => {
    const percentage = 100 // gets converted to basis points later
    const removeLp: WithdrawLiquidityPosition = {
      percentage: percentage,
      asset: AssetBTC,
      assetAddress: await mainnetWallet.clients[BTCChain].getAddressAsync(),
    }
    const hash = await mainetThorchainAmm.withdrawLiquidityPosition(mainnetWallet, removeLp)
    console.log(hash)
    expect(hash).toBeTruthy()
  })
})
