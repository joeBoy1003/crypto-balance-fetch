import fetch from 'node-fetch';  

// Function to get historical balance for a Kaspa address on a specific date  
async function getHistoricalKaspaBalance(kaspaAddress, targetDate) {  
    try {  
        // API to get full transactions for the address  
        const apiUrl = `https://api.kaspa.org/addresses/${encodeURIComponent(kaspaAddress)}/full-transactions`;  
        
        const response = await fetch(apiUrl);  
        if (!response.ok) {  
            const errorData = await response.json();  
            console.error(`Error fetching transactions for ${kaspaAddress}: ${errorData.detail}`);  
            return false; // Skip invalid address
        }  

        const transactions = await response.json();  
        let balance = 0;  

        transactions?.forEach(transaction => {  
            const transactionDate = new Date(transaction.block_time * 1000); // Convert from seconds to milliseconds  
            if (!targetDate || transactionDate <= targetDate) {  
                // Iterate through the outputs to find the amount received  
                transaction.outputs.forEach(output => {  
                    if (output.script_public_key_address === kaspaAddress) {  
                        balance += output.amount; // Incoming transaction  
                    }  
                });  

                // Iterate through the inputs to find the amount spent  
                transaction.inputs.forEach(input => {  
                    if (input.previous_outpoint_address === kaspaAddress) {  
                        balance -= input.previous_outpoint_amount; // Outgoing transaction  
                    }  
                });  
            }  
        });  

        const balanceInUSD = balance / 100000000 * 0.01; // Assuming 1 Kaspa = $0.01
        if (balanceInUSD > 300) {
            console.log(`Balance for ${kaspaAddress} on ${targetDate ? targetDate.toISOString() : 'current date'}: ${balance} ($${balanceInUSD})`);  
            return true; // Found a proper address
        }
    } catch (error) {  
        console.error(`Error fetching data for ${kaspaAddress}:`, error.message);  
    }  
    return false; // Continue searching
}  

// Function to get valid addresses from transaction history
async function getValidKaspaAddresses() {
    const apiUrl = 'https://api.kaspa.org/transactions'; // Hypothetical endpoint to get transactions
    const response = await fetch(apiUrl);
    if (!response.ok) {
        console.error('Error fetching transaction list');
        return [];
    }
    const data = await response.json();
    const addresses = new Set();
    data.items?.forEach(transaction => {
        transaction.outputs.forEach(output => {
            addresses.add(output.script_public_key_address);
        });
        transaction.inputs.forEach(input => {
            addresses.add(input.previous_outpoint_address);
        });
    });
    return Array.from(addresses);
}

// Iterate over valid addresses
async function findProperKaspaAddress() {
    const addresses = await getValidKaspaAddresses();
    for (const kaspaAddress of addresses) {
        const found = await getHistoricalKaspaBalance(kaspaAddress, null);
        if (found) break;
    }
}

findProperKaspaAddress();