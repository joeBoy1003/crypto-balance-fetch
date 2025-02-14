const axios = require('axios');  
const fs = require('fs');

// Function to get valid Bitcoin transactions with retry logic
const getValidBitcoinTransactions = async () => {
  try {
    const response = await axios.get('https://api.blockcypher.com/v1/btc/main/txs');
    return response.data; // Returning the list of transactions
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.log('Rate limit exceeded. Retrying after delay...');
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 60 seconds
      return getValidBitcoinTransactions(); // Retry the request
    } else if (error.code === 'ENOTFOUND') {
      console.log('Network error. Retrying after delay...');
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 60 seconds
      return getValidBitcoinTransactions(); // Retry the request
    } else {
      throw error;
    }
  }
};

// Function to get valid Litecoin transactions with retry logic
const getValidLitecoinTransactions = async () => {
  try {
    const response = await axios.get('https://api.blockcypher.com/v1/ltc/main/txs');
    return response.data; // Returning the list of transactions
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.log('Rate limit exceeded. Retrying after delay...');
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 60 seconds
      return getValidLitecoinTransactions(); // Retry the request
    } else if (error.code === 'ENOTFOUND') {
      console.log('Network error. Retrying after delay...');
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 60 seconds
      return getValidLitecoinTransactions(); // Retry the request
    } else {
      throw error;
    }
  }
};

// Function to extract addresses from a transaction
const extractAddresses = (transaction) => {  
  const addresses = new Set();  

  if (transaction.inputs) {  
    transaction.inputs.forEach(input => {  
      if (input.addresses && input.addresses[0]) {
        addresses.add(input.addresses[0]);  
      }
    });  
  }  

  if (transaction.outputs) {  
    transaction.outputs.forEach(output => {  
      if (output.addresses && output.addresses[0]) {
        addresses.add(output.addresses[0]);  
      }
    });  
  }  

  return Array.from(addresses);  
};  

// Function to get balance of an address
const getBitcoinBalance = async (address) => {  
  const response = await axios.get(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`);  
  return response.data.final_balance; // Balance in satoshis
};  

const getLitecoinBalance = async (address) => {  
  const response = await axios.get(`https://api.blockcypher.com/v1/ltc/main/addrs/${address}/balance`);  
  return response.data.final_balance / 1e8; // Balance in LTC
};  

// Function to get current cryptocurrency prices
const getCryptoPrices = async () => {
  const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,litecoin&vs_currencies=usd');
  return response.data;
};

// Main function to execute the process
const main = async () => {  
  try {  
    const output = [];
    const prices = await getCryptoPrices();
    const btcPrice = prices.bitcoin.usd; // Get current BTC price in USD
    const ltcPrice = prices.litecoin.usd; // Get current LTC price in USD
    console.log("Current Prices:", prices);

    // Bitcoin
    const btcTransactions = await getValidBitcoinTransactions();  
    console.log('Valid Bitcoin Transactions:', btcTransactions);  
    for (const transaction of btcTransactions) {  
      const btcAddresses = extractAddresses(transaction);  
      console.log('Extracted Bitcoin Addresses:', btcAddresses);  
      for (const address of btcAddresses) {  
        const balance = await getBitcoinBalance(address);  
        const balanceInUSD = (balance / 1e8) * btcPrice; // Convert satoshis to BTC and then to USD
        if (balanceInUSD >= 300 && balanceInUSD <= 10000) {
          console.log(`Balance for Bitcoin Address ${address}: ${balance} satoshis ($${balanceInUSD})`);  
          output.push(`Bitcoin Address: ${address}, Balance: ${balance} satoshis ($${balanceInUSD})`);
        }
      }  
    }  
    
    // Litecoin
    const ltcTransactions = await getValidLitecoinTransactions();  
    console.log('Valid Litecoin Transactions:', ltcTransactions);  
    for (const transaction of ltcTransactions) {  
      const ltcAddresses = extractAddresses(transaction);  
      console.log('Extracted Litecoin Addresses:', ltcAddresses);  
      for (const address of ltcAddresses) {  
        const balance = await getLitecoinBalance(address);  
        const balanceInUSD = balance * ltcPrice; // Convert LTC to USD
        if (balanceInUSD >= 300 && balanceInUSD <= 10000) {
          console.log(`Balance for Litecoin Address ${address}: ${balance} LTC ($${balanceInUSD})`);  
          output.push(`Litecoin Address: ${address}, Balance: ${balance} LTC ($${balanceInUSD})`);
        }
      }  
    }  

    // Write output to file
    fs.writeFileSync('output.txt', output.join('\n'), 'utf8');
    console.log('Output written to output.txt');
  } catch (error) {  
    console.error('Error:', error);  
  }  
};  

// Execute the main function
main();