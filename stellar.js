import fetch from "node-fetch";

async function getBalanceAtDate(accountId, targetDate) {  
    try {  
        // Get current account data to retrieve starting balance  
        const currentResponse = await fetch(`https://horizon.stellar.org/accounts/${accountId}`);  
        if (!currentResponse.ok) { 
            console.error(`Error fetching account data for ${accountId}`);
            return false; // Skip invalid address
        }

        const accountData = await currentResponse.json();  
        // Assuming you're interested in the first asset  
        let balance = parseFloat(accountData.balances[0].balance);  
        

        // Fetch payments for the account  
        const paymentsResponse = await fetch(`https://horizon.stellar.org/accounts/${accountId}/payments`);  
        if (!paymentsResponse.ok) { 
            console.error(`Error fetching payment data for ${accountId}`);
            return false; // Skip invalid address
        }

        const paymentsData = await paymentsResponse.json();  
        
        // Iterate through payments and calculate balance  
        paymentsData._embedded.records?.forEach(payment => {  
            const paymentDate = new Date(payment.created_at);  

            if (!targetDate || paymentDate <= targetDate) {  
                if (payment.from === accountId) {  
                    // Outgoing payment  
                    balance -= parseFloat(payment.amount);  
                } else if (payment.to === accountId) {  
                    // Incoming payment  
                    balance += parseFloat(payment.amount);  
                }  
            }  
        });  
        
        const balanceInUSD = balance * 0.1; // Assuming 1 XLM = $0.1
        if (balanceInUSD > 300) {
            console.log(`Balance for ${accountId} on ${targetDate ? targetDate.toISOString() : 'current date'}: ${balance} XLM ($${balanceInUSD})`);  
            return true; // Found a proper address
        }
    } catch (error) {  
        console.error(`Error fetching data for ${accountId}:`, error.message);  
    }  
    return false; // Continue searching
}  

// Function to get valid addresses from transaction history
async function getValidStellarAddresses() {
    const apiUrl = 'https://horizon.stellar.org/transactions'; // Hypothetical endpoint to get transactions
    const response = await fetch(apiUrl);
    if (!response.ok) {
        console.error('Error fetching transaction list');
        return [];
    }
    const data = await response.json();
    const addresses = new Set();
    data._embedded.records?.forEach(transaction => {
        if (transaction.source_account) {
            addresses.add(transaction.source_account);
        }
        if (transaction.to) {
            addresses.add(transaction.to);
        }
    });
    return Array.from(addresses);
}

// Iterate over valid addresses
async function findProperStellarAddress() {
    const addresses = await getValidStellarAddresses();
    for (const accountId of addresses) {
        const found = await getBalanceAtDate(accountId, null);
        if (found) break;
    }
}

findProperStellarAddress();