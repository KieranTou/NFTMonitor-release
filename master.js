require("dotenv").config({ path: ".env" });
const { ethers } = require("ethers");
const { fork } = require("child_process");
const mysql = require("mysql");

// connect the node provider
const key_list = [
  process.env.processKey1,
  process.env.processKey2,
  process.env.processKey3,
  process.env.processKey4,
  process.env.masterKey,
];
const providerETH = new ethers.providers.JsonRpcProvider(key_list[4]);


const processWorker = fork("process.js");

// monitor if a new block is packaged on the chain
let pre_blockNumber = 0;
async function isNewBlockPackaged() {
  let new_blockNumber = await providerETH.getBlockNumber();
  if (new_blockNumber != pre_blockNumber) {
    pre_blockNumber = new_blockNumber;
    return [true, new_blockNumber];
  } else {
    return [false, -1];
  }
}

// the main function..
async function main(block) {
  let blockInfo = await providerETH.getBlock(block).catch(err=>{});
  try {
    let txs_hash = blockInfo["transactions"];
    let time = blockInfo["timestamp"];
    console.log(
      `current timeStamp is ${time} monitor the new block is ${block} it has ${txs_hash.length} txs`
    );
    return [txs_hash, time];
  } catch (err) {}
}

setInterval(async () => {
  let [flag, block] = await isNewBlockPackaged();
  // console.log(flag,block);
  if (flag) {
    let [txs_hash, time] = await main(block).catch((err) => {});
    let scale = parseInt(txs_hash.length / 4);
    for (let i = 0; i < 4; i++) {
      if (i < 3) {
        processWorker.send([
          txs_hash.slice(scale * i, scale * i + scale),
          time,
          key_list[i],
        ]);
      } else {
        processWorker.send([
          txs_hash.slice(scale * i, txs_hash.length),
          time,
          key_list[i],
        ]);
      }
    }
  }
}, 5000);
