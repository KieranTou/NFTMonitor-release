const mysql = require("mysql");
const Redis = require("ioredis");

const pool = mysql.createPool({
  host: "",
  user: "",
  password: "",
  database: "nft",
  connectionLimit: 1000,
  connectTimeout: 60 * 60 * 1000,
  acquireTimeout: 60 * 60 * 1000,
  timeout: 60 * 60 * 1000,
});

const redis = new Redis({
  port: 6379, // Redis port
  host: "", // Redis host
  username: "", // needs Redis >= 6
  password: "",
  db: 3, // Defaults to 0
});

module.exports = {
  getTextSignature: async function (methodID) {
    const text = await redis.lrange(methodID, 0, -1);
    // console.log(text);
    return text;
  },
  insertTx: function (
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
    textSignature
  ) {
    pool.getConnection(function (err, con) {
      if (err) {
        throw err;
      } else {
        let sql = `INSERT INTO transactions (txHash,blockNumber,contract,minter,gasUsed,gasPrice,effectiveGasPrice,mintStatus,methodID,inputValueList,mintTime,textSignature) VALUES (hex(${txHash}),${blockNumber},hex(${contract}),hex(${to}),${gasUsed},${gasPrice},${effectiveGasPrice},${status},hex(${methodID}),hex(${value}),${timeStamp},"${textSignature}")`;
        con.query(sql, function (qerr, result) {
          if (qerr) {
            throw qerr;
          } else {
            con.release();
          }
        });
      }
    });
  },
  hasNoContract: async function (contract_address, callback) {
    pool.getConnection(function (err, con) {
      if (err) {
        throw err;
      } else {
        let sql = `select 1 from contracts where contract_address="${contract_address}" limit 1;`;
        con.query(sql, function (qerr, result) {
          if (qerr) {
            callback(err, null);
          } else {
            // console.log(typeof result);
            // console.log(`result is ${result}`);
            callback(null, result);
            con.release();
          }
        });
      }
    });
  },
  insertContract: function (
    contract_address,
    abi,
    SourceCode,
    ContractName,
    Proxy,
    Implementation
  ) {
    let sql = "";
    pool.getConnection(function (err, con) {
      if (err) {
        throw err;
      } else {
        let etherscan = `https://etherscan.io/address/${contract_address}`;
        let opensea = `https://opensea.io/collection/${ContractName}`;
        let blur = `https://blur.io/collection/${contract_address}`;
        let uniswap = `https://app.uniswap.org/#/nfts/collection/${contract_address}`;
        let coinbase = `https://nft.coinbase.com/collection/ethereum/${contract_address}`;
        let gem = `https://www.gem.xyz/collection/${contract_address}/`;
        let magically = `https://magically.gg/collection/${contract_address}`;
        let sudoswap = `https://sudoswap.xyz/#/browse/buy/${contract_address}`;
        let nftflip = `https://review.nftflip.ai/collection/${contract_address}`;
        let nftnerd = `https://app.nftnerds.ai/collection/${contract_address}`;
        let x2y2 = `https://x2y2.io/collection/${ContractName}/items`;
        let looksrare = `https://looksrare.org/collections/${contract_address}`;

        if (Implementation == 0) {
          sql = `INSERT INTO contracts (contract_address,abi,contract_name,isProxy,implementation,etherscan,opensea,blur,uniswap,coinbase,gem,magically,sudoswap,nftflip,nftnerd,x2y2,looksrare) VALUES (hex(${contract_address}),'${abi}',"${ContractName}",${Proxy},NULL,"${etherscan}","${opensea}","${blur}","${uniswap}","${coinbase}","${gem}","${magically}","${sudoswap}","${nftflip}","${nftnerd}","${x2y2}","${looksrare}")`;
        } else {
          sql = `INSERT INTO contracts (contract_address,abi,contract_name,isProxy,implementation,etherscan,opensea,blur,uniswap,coinbase,gem,magically,sudoswap,nftflip,nftnerd,x2y2,looksrare) VALUES (hex(${contract_address}),'${abi}',"${ContractName}",${Proxy},hex(${Implementation}),"${etherscan}","${opensea}","${blur}","${uniswap}","${coinbase}","${gem}","${magically}","${sudoswap}","${nftflip}","${nftnerd}","${x2y2}","${looksrare}")`;
        }
        con.query(sql, function (qerr, result) {
          if (qerr) {
            // throw qerr;
            con.release();
          } else {
            con.release();
          }
        });
      }
    });
  },
};

