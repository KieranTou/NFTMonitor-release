require("dotenv").config({ path: ".env" });
const {
  getTextSignature,
  insertTx,
  insertContract,
  hasNoContract,
} = require("./database.js");
const { ethers } = require("ethers");
const utils = ethers.utils;
const { getContract,storeCode } = require("./contract.js");

// connect the node provider
// const providerETH = new ethers.providers.JsonRpcProvider(process.env.QUICK_URL);

// judge the event is or not Mint
async function isMint(logs) {
  const zero_address =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  for (let j = logs.length - 1; j >= 0; j--) {
    // Judge the event type through logs topics[0]
    let event = logs[j].topics[0];
    let from_Transfer = logs[j].topics[1];
    let from_TransferSingle = logs[j].topics[2];
    // Transfer
    if (
      event ==
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" &&
      from_Transfer == zero_address
    ) {
      try {
        let tokenId = utils.defaultAbiCoder
          .decode(["uint256"], logs[j].topics[3])
          .toString();
        if (tokenId < 1000000) {
          // distribute ERC20 with ERC721
          let contract = logs[j].address; //contract address or logic contracr address
          let to = utils.defaultAbiCoder.decode(["address"], logs[j].topics[2]);
          return [true, contract, to];
        }
      } catch (err) {
        // console.log("just have 2 topics Non compliance");
      }
    }
    // TransferSingle
    else if (
      event ==
        "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62" &&
      from_TransferSingle == zero_address
    ) {
      let contract = logs[j].address;
      let to = utils.defaultAbiCoder.decode(["address"], logs[j].topics[3]);
      // let operator = utils.defaultAbiCoder.decode(['address'],logs[j].topics[1]);
      // let [id,value] = utils.defaultAbiCoder.decode(['uint256','uint256'],logs[j].data).toString();
      return [true, contract, to];
    }
  }
  return [false, -1, -1];
}

// get tx's details
async function getTx(tx_hash, provider) {
  let tx = await provider.getTransaction(tx_hash);
  // console.log(tx.gasPrice.toString(), tx.data.slice(0, 10));
  return [tx.gasPrice.toString(), tx.data.slice(0, 10), tx.data];
}

//get function ABI
async function getABI(methodID) {
  let text = await getTextSignature(methodID);
  if (text.length == 0) {
    return null;
  } else {
    return text;
  }
}

// get receipts
async function processReceipt(txs_hash, provider) {
  let dataflow = [];
  for (let i = txs_hash.length - 1; i >= 0; i--) {
    let receipt = await provider
      .getTransactionReceipt(txs_hash[i])
      .catch((err) => {});
    try {
      // Exclude transfer between EOA
      let logs = receipt.logs;
      let [mint_flag, contract, to] = await isMint(logs);
      if (mint_flag) {
        let [gasPrice, input, data] = await getTx(txs_hash[i], provider);
        let ABI = await getABI(input);
        dataflow.push([
          txs_hash[i],
          receipt.blockNumber,
          contract,
          to[0],
          receipt.gasUsed.toString(),
          gasPrice,
          receipt.effectiveGasPrice.toString(),
          receipt.status,
          input,
          data,
          ABI,
        ]);
      }
    } catch (err) {
      // console.log("this receipt does not have logs,the tx is between EOA");
    }
  }
  return dataflow;
}

process.on("message", async (args) => {
  let [txs_hash, time, providerUrl] = args;
  let provider = new ethers.providers.JsonRpcProvider(providerUrl);
  let information = await processReceipt(txs_hash, provider);
  if (information.length != 0) {
    let timeStamp = time;
    console.log(`there are ${information.length} records will be inserted`);
    for (let i = 0; i < information.length; i++) {
      let [
        txHash,
        blockNumber,
        contract,
        to,
        gasUsed,
        gasPrice,
        effectiveGasPrice,
        status,
        methodID,
        value,
        ABI,
      ] = information[i];
      try {
        insertTx(
          txHash,
          blockNumber,
          contract,
          to,
          gasUsed,
          gasPrice,
          effectiveGasPrice,
          status,
          methodID,
          value,
          timeStamp,
          ABI
        );
      } catch (err) {}

      hasNoContract(contract,async function(err,data){
        if(err){
          console.log(err);
        }else{
          let data_json = JSON.stringify(data);
          if (data_json.length == 2) {
            // console.log("database does not have this contract information get it!");
            let [
              contract_address,
              abi,
              SourceCode,
              ContractName,
              Proxy,
              Implementation,
            ] = await getContract(contract);
              insertContract(
                contract_address,
                abi,
                SourceCode,
                ContractName,
                Proxy,
                Implementation
              );
              storeCode(SourceCode,ContractName);
          }
        }
      });
    }
  }
  process.exitCode = 1;
});
