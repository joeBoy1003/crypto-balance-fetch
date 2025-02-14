import fetch from 'node-fetch';  

// Function to get historical balance for a Sei address on a specific date  
async function getHistoricalSeiBalance(seiAddress, targetDate) {  
    try {  
        const apiUrl = `https://api.seistream.app/accounts/${encodeURIComponent(seiAddress)}/transactions`;  
        console.log(`Fetching data from: ${apiUrl}`);  

        const response = await fetch(apiUrl);  
        if (!response.ok) {  
            const errorData = await response.json();  
            console.error(`Error fetching transactions for ${seiAddress}: ${errorData.message}`);  
            return false; // Skip invalid address
        }  

        const data = await response.json();  
        let balance = 0;  

        // Iterate through the transactions  
        data.items?.forEach(transaction => {  
            const transactionDate = new Date(transaction.time);  
            if (!targetDate || transactionDate <= targetDate) {  
                // Handle incoming and outgoing transactions based on rawLog  
                const rawLog = JSON.parse(transaction.rawLog || '[]'); // Default to empty array if undefined  
                rawLog.forEach(event => {  
                    if (event.events) {  
                        event.events.forEach(e => {  
                            // Check for coin_received event  
                            if (e.type === 'coin_received') {  
                                e.attributes.forEach(attr => {  
                                    if (attr.key === 'receiver' && attr.value === seiAddress) {  
                                        const amount = attr.amount ? parseInt(attr.amount.replace('usei', ''), 10) : 0;  
                                        balance += amount; // Incoming transaction  
                                    }  
                                });  
                            }  
                            // Check for coin_spent event  
                            if (e.type === 'coin_spent') {  
                                e.attributes.forEach(attr => {  
                                    if (attr.key === 'spender' && attr.value === seiAddress) {  
                                        const amount = attr.amount ? parseInt(attr.amount.replace('usei', ''), 10) : 0;  
                                        balance -= amount; // Outgoing transaction  
                                    }  
                                });  
                            }  
                        });  
                    }  
                });  
            }  
        });  

        const balanceInUSD = balance / 1000000 * 0.1; // Assuming 1 usei = $0.1
        if (balanceInUSD > 300) {
            console.log(`Balance for ${seiAddress} on ${targetDate ? targetDate.toISOString() : 'current date'}: ${balance} usei ($${balanceInUSD})`);  
            return true; // Found a proper address
        }
    } catch (error) {  
        console.error(`Error fetching data for ${seiAddress}:`, error.message);  
    }  
    return false; // Continue searching
}  

// Function to get valid addresses from transaction history
async function getValidSeiAddresses() {
    const apiUrl = 'https://api.seistream.app/transactions'; // Hypothetical endpoint to get transactions
    const response = await fetch(apiUrl);
    if (!response.ok) {
        console.error('Error fetching transaction list');
        return [];
    }
    const data = await response.json();
    const addresses = new Set();
    data.items?.forEach(transaction => {
        const rawLog = JSON.parse(transaction.rawLog || '[]');
        rawLog.forEach(event => {
            if (event.events) {
                event.events.forEach(e => {
                    e.attributes.forEach(attr => {
                        if (attr.key === 'receiver' || attr.key === 'spender') {
                            addresses.add(attr.value);
                        }
                    });
                });
            }
        });
    });
    return Array.from(addresses);
}

// Iterate over valid addresses
async function findProperSeiAddress() {
    const addresses = await getValidSeiAddresses();
    for (const seiAddress of addresses) {
        const found = await getHistoricalSeiBalance(seiAddress, null);
        if (found) break;
    }
}

findProperSeiAddress();