const axios = require("axios");
const fs = require('fs');

async function storeCode(sourceCode,contract_name){
  const url = `../sourcecode/${contract_name}.txt`;
  const data = fs.writeFileSync(url, sourceCode,{ flag: 'w+' },(err)=>{console.log("file error is "+err);});
}


const getContract = async (contract_address) => {
  const apiKey = "";
  const url = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contract_address}&apikey=${apiKey}`;
  try {
    const res = await axios.get(url);
    let data = res.data.result[0];
    const ABI = data.ABI;
    const SourceCode = data.SourceCode;
    const ContractName = data.ContractName;
    const Proxy = data.Proxy;
    const Implementation = data.Implementation;
    // console.log(ContractName);
    return [contract_address,ABI, SourceCode, ContractName, Proxy, Implementation];
  } catch (err) {
    // return [0,0,undefined,-1,0];
  }
};

module.exports = {
  getContract,
  storeCode
};
