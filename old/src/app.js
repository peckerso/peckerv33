// Token ve Havuz Adresleri
const TOKENS = {
    // MON Tokens
    aprMON: {
        address: "0xb2f82D0f38dc453D596Ad40A37799446Cc89274A",
        symbol: "aprMON",
        name: "APR MON",
        decimals: 18,
        icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg" // Example icon
    },
    gMON: {
        address: "0xaEef2f6B429Cb59C9B2D7bB2141ADa993E8571c3",
        symbol: "gMON", 
        name: "gMON",
        decimals: 18,
        icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg" // Example icon
    },
    shMON: {
        address: "0x3a98250F98Dd388C211206983453837C8365BDc1",
        symbol: "shMON",
        name: "shMON",
        decimals: 18,
        icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg" // Example icon
    },
    WMON: {
        address: "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701",
        symbol: "WMON",
        name: "Wrapped MON",
        decimals: 18,
        icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg" // Example icon
    },
    // USD Tokens
    USDC: {
        address: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg" // Example icon
    },
    USDT: {
        address: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D",
        symbol: "USDT",
        name: "Tether USD",
        decimals: 6,
        icon: "https://cryptologos.cc/logos/tether-usdt-logo.svg" // Example icon
    }
};

// Havuzlar
const POOLS = {
    aprMON: {
        address: "0x2381A7494474a5e26e49095e22a0ecB94801dbeB",
        token: "aprMON",
        name: "APR MON Pool"
    },
    gMON: {
        address: "0x42e4157fACa0a17aeb97A5Cf5544EdfE4B4C5Ec3",
        token: "gMON",
        name: "gMON Pool"
    },
    shMON: {
        address: "0xfB14b91bb664620c750BD3E42689008c6705f8d7",
        token: "shMON",
        name: "shMON Pool"
    },
    WMON: {
        address: "0x488D9F4603c99Cb443A8323A380a4654c2B68d05",
        token: "WMON",
        name: "WMON Pool"
    },
    USDC: {
        address: "0x25fF3101E83B5eE0CfE910A500AA8Df9374d8CBd",
        token: "USDC",
        name: "USDC Pool"
    },
    USDT: {
        address: "0x36c7c81C401b508C03eB0854EAA823028Da4aEf5",
        token: "USDT",
        name: "USDT Pool"
    }
};

// Router Adresleri
const ROUTERS = {
    MON: "0x889e739C6CdD73a5cd1c1a314124bf4182fb1281", // MON Router adresi
    USD: "0xE28bDCEDb128383142b5a00C5c957004E49D426a"  // USD Router adresi
};

// Monad Testnet Network Data
const CHAIN_ID = '10143';
const NETWORK_DATA = {
    chainId: ethers.utils.hexValue(parseInt(CHAIN_ID)),
    chainName: 'Monad Testnet',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: ['https://dev.rpc.monad.xyz/json-rpc'],
    blockExplorerUrls: ['https://dev.explorer.monad.xyz/']
};

// ABI definitions
const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function deposit() external payable"
];

const ROUTER_ABI = [
    "function swap(uint256 amount, bytes32 token, bytes32 receiveToken, address recipient, uint256 receiveAmountMin) external returns (uint256)",
    "function canSwap() external view returns (uint8)"
];

const POOL_ABI = [
    "function deposit(uint256 amount) external payable",
    "function withdraw(uint256 amountLp) external",
    "function balanceOf(address account) external view returns (uint256)",
    "function tokenBalance() external view returns (uint256)",
    "function vUsdBalance() external view returns (uint256)",
    "function getY(uint256 x) external view returns (uint256)",
    "function feeShareBP() external view returns (uint16)",
    "function a() external view returns (uint256)",
    "function d() external view returns (uint256)"
];

// State variables
let provider = null;
let signer, currentAccount;
let selectedFromToken = null;
let selectedToToken = null;
let selectedDepositPool = null;
let selectedWithdrawPool = null;

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Tab Management
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Change active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Show related content
            const tabId = button.getAttribute('data-tab');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Event listeners for Token Selectors
    const fromTokenSelector = document.getElementById('from-token-selector');
    const fromTokenDropdown = document.getElementById('from-token-dropdown');
    const toTokenSelector = document.getElementById('to-token-selector');
    const toTokenDropdown = document.getElementById('to-token-dropdown');

    // Populate token lists
    populateTokenLists();

    // From token selector
    fromTokenSelector.addEventListener('click', () => {
        fromTokenDropdown.classList.toggle('show');
        if (toTokenDropdown.classList.contains('show')) {
            toTokenDropdown.classList.remove('show');
        }
    });

    // To token selector
    toTokenSelector.addEventListener('click', () => {
        toTokenDropdown.classList.toggle('show');
        if (fromTokenDropdown.classList.contains('show')) {
            fromTokenDropdown.classList.remove('show');
        }
    });

    // Event listeners for Pool Selectors
    const depositPoolSelect = document.getElementById('deposit-pool-select');
    const withdrawPoolSelect = document.getElementById('withdraw-pool-select');

    // Populate pool lists
    populatePoolLists(depositPoolSelect);
    populatePoolLists(withdrawPoolSelect);

    // Listen for pool selections
    depositPoolSelect.addEventListener('change', async (e) => {
        const poolKey = e.target.value;
        selectedDepositPool = POOLS[poolKey];
        if (selectedDepositPool && currentAccount) {
            await updateDepositTokenBalance();
        }
    });

    withdrawPoolSelect.addEventListener('change', async (e) => {
        const poolKey = e.target.value;
        selectedWithdrawPool = POOLS[poolKey];
        if (selectedWithdrawPool && currentAccount) {
            await updateWithdrawTokenBalance();
        }
    });

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Listen for input changes with debounce
    const fromAmountInput = document.getElementById('from-amount');
    const debouncedInputHandler = debounce(async () => {
        if (selectedFromToken && selectedToToken) {
            const amount = parseFloat(fromAmountInput.value) || 0;
            
            // Show loading state in the To amount field
            document.getElementById('to-amount').value = "Loading...";
            document.getElementById('min-receive-value').textContent = "Calculating...";
            document.getElementById('price-impact-value').textContent = "Calculating...";
            document.getElementById('gas-estimate-value').textContent = "~0.0002 MON";
            
            try {
                // Fixed fee rate (30 = 0.3%)
                const FEE_SHARE_BP = 30;
                
                // Fee calculation
                const fee = amount * (FEE_SHARE_BP / 10000);
                const amountAfterFee = amount - fee;
                
                // Update UI with the estimated output (3 decimals)
                if (amountAfterFee > 0) {
                    document.getElementById('to-amount').value = amountAfterFee.toFixed(3);
                    
                    // Update minimum received (50% slippage tolerance)
                    const minReceive = amountAfterFee * 0.5;
                    document.getElementById('min-receive-value').textContent = minReceive.toFixed(3);
                    
                    // Calculate price impact as (1 - receive/send) * 100
                    const priceImpact = (1 - amountAfterFee / amount) * 100;
                    document.getElementById('price-impact-value').textContent = priceImpact.toFixed(2) + "%";
                } else {
                    document.getElementById('to-amount').value = "0";
                    document.getElementById('min-receive-value').textContent = "0";
                    document.getElementById('price-impact-value').textContent = "0.00%";
                }
            } catch (error) {
                console.error('Error updating quote:', error);
                document.getElementById('to-amount').value = "Error";
                document.getElementById('min-receive-value').textContent = "Error";
                document.getElementById('price-impact-value').textContent = "Error";
            }
        }
    }, 300); // 300ms debounce is enough now

    fromAmountInput.addEventListener('input', debouncedInputHandler);

    // Swap, Deposit and Withdraw buttons
    const swapButton = document.getElementById('swap-button');
    const depositButton = document.getElementById('deposit-button');
    const withdrawButton = document.getElementById('withdraw-button');

    swapButton.addEventListener('click', handleSwap);
    depositButton.addEventListener('click', handleDeposit);
    withdrawButton.addEventListener('click', handleWithdraw);

    // Wallet connection button
    const connectWalletButton = document.getElementById('connect-wallet');
    connectWalletButton.addEventListener('click', connectWallet);

    // Network modal close button
    const closeNetworkModal = document.getElementById('close-network-modal');
    closeNetworkModal.addEventListener('click', () => {
        document.getElementById('network-modal').classList.remove('show');
    });

    // Listener for clicks outside
    document.addEventListener('click', (e) => {
        // Close token dropdowns
        if (!fromTokenSelector.contains(e.target) && !fromTokenDropdown.contains(e.target)) {
            fromTokenDropdown.classList.remove('show');
        }
        if (!toTokenSelector.contains(e.target) && !toTokenDropdown.contains(e.target)) {
            toTokenDropdown.classList.remove('show');
        }
    });

    // Check MetaMask connection when page loads
    checkIfWalletIsConnected();
});

// Populate token lists
function populateTokenLists() {
    const fromTokenList = document.getElementById('from-token-list');
    const toTokenList = document.getElementById('to-token-list');

    // Clear lists
    fromTokenList.innerHTML = '';
    toTokenList.innerHTML = '';

    // Add tokens
    Object.keys(TOKENS).forEach(key => {
        const token = TOKENS[key];
        
        // From token list
        const fromTokenItem = createTokenListItem(token, (selectedToken) => {
            selectedFromToken = selectedToken;
            document.getElementById('from-token-icon').src = selectedToken.icon;
            document.getElementById('from-token-name').textContent = selectedToken.symbol;
            document.getElementById('from-token-dropdown').classList.remove('show');
            
            // Update balance
            if (currentAccount) {
                updateTokenBalance(selectedToken, 'from-token-balance');
            }
        });
        fromTokenList.appendChild(fromTokenItem);
        
        // To token list
        const toTokenItem = createTokenListItem(token, (selectedToken) => {
            selectedToToken = selectedToken;
            document.getElementById('to-token-icon').src = selectedToken.icon;
            document.getElementById('to-token-name').textContent = selectedToken.symbol;
            document.getElementById('to-token-dropdown').classList.remove('show');
            
            // Update balance
            if (currentAccount) {
                updateTokenBalance(selectedToken, 'to-token-balance');
            }
        });
        toTokenList.appendChild(toTokenItem);
    });
}

// Populate pool lists
function populatePoolLists(selectElement) {
    // Clear list
    selectElement.innerHTML = '<option value="" disabled selected>Select pool</option>';
    
    // Add pools
    Object.keys(POOLS).forEach(key => {
        const pool = POOLS[key];
        const option = document.createElement('option');
        option.value = key;
        option.textContent = pool.name;
        selectElement.appendChild(option);
    });
}

// Create token list item
function createTokenListItem(token, onSelectCallback) {
    const listItem = document.createElement('li');
    listItem.className = 'token-item';
    
    const icon = document.createElement('img');
    icon.src = token.icon;
    icon.className = 'token-icon';
    
    const info = document.createElement('div');
    info.className = 'token-info';
    
    const symbol = document.createElement('span');
    symbol.className = 'token-symbol';
    symbol.textContent = token.symbol;
    
    const address = document.createElement('span');
    address.className = 'token-address';
    // Show shortened address
    address.textContent = `${token.address.slice(0, 6)}...${token.address.slice(-4)}`;
    
    info.appendChild(symbol);
    info.appendChild(address);
    
    listItem.appendChild(icon);
    listItem.appendChild(info);
    
    listItem.addEventListener('click', () => {
        onSelectCallback(token);
    });
    
    return listItem;
}

// Check MetaMask wallet connection
async function checkIfWalletIsConnected() {
    try {
        // Check if MetaMask is installed
        if (window.ethereum) {
            // Query connected accounts
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            
            if (accounts.length > 0) {
                // User is already connected
                connectWallet();
            } else {
                // User is not connected, update buttons
                updateButtonStates(false);
            }
        } else {
            alert('Please install MetaMask!');
        }
    } catch (error) {
        console.error(error);
    }
}

// Connect to MetaMask wallet
async function connectWallet() {
    try {
        if (window.ethereum) {
            // Set up Web3 Provider
            provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Request account access from user
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Get signer
            signer = provider.getSigner();
            currentAccount = await signer.getAddress();
            
            // Check network
            const network = await provider.getNetwork();
            if (network.chainId !== 10143) { // Monad Testnet chain ID
                showNetworkModal();
            }
            
            // Update buttons
            updateButtonStates(true);
            
            // Show wallet address (shortened)
            const walletStatus = document.getElementById('wallet-status');
            walletStatus.textContent = `${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}`;
            
            // Add event listeners
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
        } else {
            alert('Please install MetaMask!');
        }
    } catch (error) {
        console.error(error);
    }
}

// Show network switching modal
function showNetworkModal() {
    const modal = document.getElementById('network-modal');
    modal.classList.add('show');
    
    // Add event listener to network switching button
    const networkItem = document.querySelector('.network-item');
    networkItem.addEventListener('click', switchToMonadTestnet);
}

// Switch to Monad Testnet
async function switchToMonadTestnet() {
    try {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
                {
                    chainId: NETWORK_DATA.chainId,
                    chainName: NETWORK_DATA.chainName,
                    nativeCurrency: NETWORK_DATA.nativeCurrency,
                    rpcUrls: NETWORK_DATA.rpcUrls,
                    blockExplorerUrls: NETWORK_DATA.blockExplorerUrls
                }
            ],
        });
        
        document.getElementById('network-modal').classList.remove('show');
    } catch (error) {
        console.error(error);
    }
}

// Update token balance
async function updateTokenBalance(token, elementId) {
    try {
        if (!provider || !currentAccount) return;
        
        const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);
        const balance = await tokenContract.balanceOf(currentAccount);
        const formattedBalance = ethers.utils.formatUnits(balance, token.decimals);
        
        document.getElementById(elementId).textContent = parseFloat(formattedBalance).toFixed(4);
    } catch (error) {
        console.error('Error updating balance:', error);
    }
}

// Update deposit token balance
async function updateDepositTokenBalance() {
    if (!selectedDepositPool || !currentAccount) return;

    const token = TOKENS[selectedDepositPool.token];
    const balanceElement = document.getElementById('deposit-token-balance');

    try {
        if (selectedDepositPool.token === 'WMON') {
            // WMON token balance
            const tokenContract = new ethers.Contract(token.address, ERC20_ABI, signer);
            const wmonBalance = await tokenContract.balanceOf(currentAccount);
            
            // Native MON balance
            const nativeBalance = await provider.getBalance(currentAccount);
            
            // Total balance (WMON + native MON)
            const totalBalance = wmonBalance.add(nativeBalance);
            
            // Show balance
            const formattedBalance = ethers.utils.formatUnits(totalBalance, token.decimals);
            balanceElement.textContent = `Balance: ${formattedBalance} ${token.symbol} (WMON + native MON)`;
        } else {
            // Normal balance display for other tokens
            const tokenContract = new ethers.Contract(token.address, ERC20_ABI, signer);
            const balance = await tokenContract.balanceOf(currentAccount);
            const formattedBalance = ethers.utils.formatUnits(balance, token.decimals);
            balanceElement.textContent = `Balance: ${formattedBalance} ${token.symbol}`;
        }
    } catch (error) {
        console.error('Balance update error:', error);
        balanceElement.textContent = 'Balance: Error';
    }
}

// Update withdraw token balance
async function updateWithdrawTokenBalance() {
    if (selectedWithdrawPool && currentAccount) {
        try {
            // Get the pool contract to check LP token balance
            const poolContract = new ethers.Contract(selectedWithdrawPool.address, POOL_ABI, provider);
            
            // Check user's LP token balance in the pool
            const lpBalance = await poolContract.balanceOf(currentAccount);
            
            // Use 3 decimals for LP tokens as specified
            const LP_DECIMALS = 3;
            const formattedBalance = ethers.utils.formatUnits(lpBalance, LP_DECIMALS);
            
            // Update the displayed balance
            document.getElementById('withdraw-token-balance').textContent = parseFloat(formattedBalance).toFixed(4);
            
            console.log(`Updated LP token balance for ${selectedWithdrawPool.name}: ${formattedBalance} (using ${LP_DECIMALS} decimals)`);
        } catch (error) {
            console.error('Error fetching LP token balance:', error);
            document.getElementById('withdraw-token-balance').textContent = "0.0000";
        }
    }
}

// Handle account changes
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // User disconnected
        currentAccount = null;
        updateButtonStates(false);
        document.getElementById('wallet-status').textContent = 'Connect';
    } else if (accounts[0] !== currentAccount) {
        // Account changed
        currentAccount = accounts[0];
        const walletStatus = document.getElementById('wallet-status');
        walletStatus.textContent = `${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}`;
        
        // Update balances
        if (selectedFromToken) updateTokenBalance(selectedFromToken, 'from-token-balance');
        if (selectedToToken) updateTokenBalance(selectedToToken, 'to-token-balance');
        if (selectedDepositPool) updateDepositTokenBalance();
        if (selectedWithdrawPool) updateWithdrawTokenBalance();
    }
}

// Handle network changes
function handleChainChanged() {
    // Page will reload
    window.location.reload();
}

// Update button states
function updateButtonStates(isConnected) {
    const swapButton = document.getElementById('swap-button');
    const depositButton = document.getElementById('deposit-button');
    const withdrawButton = document.getElementById('withdraw-button');
    
    if (isConnected) {
        swapButton.disabled = false;
        swapButton.textContent = 'Swap';
        
        depositButton.disabled = false;
        depositButton.textContent = 'Deposit to Pool';
        
        withdrawButton.disabled = false;
        withdrawButton.textContent = 'Withdraw from Pool';
    } else {
        swapButton.disabled = true;
        swapButton.textContent = 'Connecting Wallet...';
        
        depositButton.disabled = true;
        depositButton.textContent = 'Connecting Wallet...';
        
        withdrawButton.disabled = true;
        withdrawButton.textContent = 'Connecting Wallet...';
    }
}

// Execute swap transaction
async function handleSwap() {
    try {
        if (!selectedFromToken || !selectedToToken || !currentAccount) {
            alert('Please select tokens and connect your wallet.');
            return;
        }
        
        const amount = document.getElementById('from-amount').value;
        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount.');
            return;
        }
        
        // HTML element reference
        const swapButton = document.getElementById('swap-button');
        
        // Update gas estimate when starting swap
        document.getElementById('gas-estimate-value').textContent = "Calculating...";
        
        // Determine which router to use
        const isMonTokens = ['aprMON', 'gMON', 'shMON', 'WMON'].includes(selectedFromToken.symbol);
        const routerAddress = isMonTokens ? ROUTERS.MON : ROUTERS.USD;
        
        console.log(`Starting swap operation: ${selectedFromToken.symbol} -> ${selectedToToken.symbol}`);
        console.log(`Router address: ${routerAddress}`);
        console.log(`Amount: ${amount}`);
        
        // Approval process
        const tokenContract = new ethers.Contract(selectedFromToken.address, ERC20_ABI, signer);
        const amountInWei = ethers.utils.parseUnits(amount, selectedFromToken.decimals);
        
        // Check current allowance
        console.log("Checking allowance...");
        const allowance = await tokenContract.allowance(currentAccount, routerAddress);
        console.log(`Current allowance: ${ethers.utils.formatUnits(allowance, selectedFromToken.decimals)}`);
        
        // If no allowance or insufficient, get token approval
        if (allowance.lt(amountInWei)) {
            console.log("Allowance needed, starting approve process...");
            
            // Inform user about token spending approval
            alert("You need to give approval (approve) for the router contract to use your tokens. MetaMask will open and ask you to complete the approval process.");
            
            swapButton.textContent = 'Waiting for Approval...';
            
            // Update the gas estimate for approval (rough estimate)
            document.getElementById('gas-estimate-value').textContent = "~0.0003 MON (approval)";
            
            try {
                // Token approval (approve) operation
                const approveTx = await tokenContract.approve(routerAddress, ethers.constants.MaxUint256);
                console.log(`Approval transaction sent: ${approveTx.hash}`);
                
                // Wait for transaction confirmation
                console.log("Waiting for transaction confirmation...");
                const receipt = await approveTx.wait();
                console.log(`Approval completed: ${receipt.transactionHash}`);
            } catch (approveError) {
                console.error("Error during approval process:", approveError);
                alert(`Error during token approval: ${approveError.message}`);
                swapButton.textContent = 'Swap';
                // Reset gas estimate
                document.getElementById('gas-estimate-value').textContent = "~0.0002 MON";
                return;
            }
        } else {
            console.log("Allowance sufficient, no approve needed");
        }
        
        // Update gas estimate for the swap itself
        document.getElementById('gas-estimate-value').textContent = "~0.0002 MON (swap)";
        
        // Router contract
        console.log("Calling router contract...");
        const routerContract = new ethers.Contract(routerAddress, ROUTER_ABI, signer);
        
        // Prepare parameters for swap operation
        const fromTokenBytes32 = ethers.utils.hexZeroPad(selectedFromToken.address, 32);
        const toTokenBytes32 = ethers.utils.hexZeroPad(selectedToToken.address, 32);
        // Get the current value from UI for minimum received
        const toAmountValue = parseFloat(document.getElementById('to-amount').value) || 0;
        const minReceiveAmount = ethers.utils.parseUnits((toAmountValue * 0.5).toString(), selectedToToken.decimals);
        
        console.log(`From Token Bytes32: ${fromTokenBytes32}`);
        console.log(`To Token Bytes32: ${toTokenBytes32}`);
        console.log(`Minimum To Receive: ${ethers.utils.formatUnits(minReceiveAmount, selectedToToken.decimals)} (50% slippage tolerance)`);
        
        // Execute swap
        swapButton.textContent = 'Transaction in Progress...';
        
        try {
            const swapTx = await routerContract.swap(
                amountInWei,
                fromTokenBytes32,
                toTokenBytes32,
                currentAccount,
                minReceiveAmount
            );
            
            console.log(`Swap transaction sent: ${swapTx.hash}`);
            
            // Wait for transaction to complete
            console.log("Waiting for swap transaction confirmation...");
            const receipt = await swapTx.wait();
            console.log(`Swap transaction completed: ${receipt.transactionHash}`);
            
            // Update UI
            document.getElementById('from-amount').value = '';
            document.getElementById('to-amount').value = '';
            document.getElementById('min-receive-value').textContent = '0';
            document.getElementById('price-impact-value').textContent = '0.00%';
            document.getElementById('gas-estimate-value').textContent = '~0.0002 MON';
            swapButton.textContent = 'Swap';
            
            // Update balances
            updateTokenBalance(selectedFromToken, 'from-token-balance');
            updateTokenBalance(selectedToToken, 'to-token-balance');
            
            alert('Swap completed successfully!');
        } catch (swapError) {
            console.error("Error during swap operation:", swapError);
            alert(`Swap operation failed: ${swapError.message}`);
            swapButton.textContent = 'Swap';
            document.getElementById('gas-estimate-value').textContent = '~0.0002 MON';
        }
    } catch (error) {
        console.error('Error during swap operation:', error);
        alert(`Swap operation failed: ${error.message}`);
        document.getElementById('swap-button').textContent = 'Swap';
        document.getElementById('gas-estimate-value').textContent = '~0.0002 MON';
    }
}

// Execute deposit transaction
async function handleDeposit() {
    try {
        if (!currentAccount) {
            alert('Please connect your wallet first');
            return;
        }

        const amountInput = document.getElementById('deposit-amount');
        const amount = amountInput.value;

        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (!selectedDepositPool) {
            alert('Please select a pool');
            return;
        }

        const token = TOKENS[selectedDepositPool.token];
        const poolContract = new ethers.Contract(selectedDepositPool.address, POOL_ABI, signer);
        
        // Convert amount to token's decimal
        const amountWei = ethers.utils.parseUnits(amount, token.decimals);

        // Deposit with native MON for WMON
        if (selectedDepositPool.token === 'WMON') {
            console.log('Depositing to WMON pool:', selectedDepositPool.address);
            console.log('Amount in wei:', amountWei.toString());
            
            // Send native MON directly to pool
            const tx = await poolContract.deposit(amountWei, {
                value: amountWei
            });
            console.log('Transaction sent:', tx.hash);
            await tx.wait();
            console.log('Transaction confirmed');
            alert('Deposit successful!');
        } else {
            // Normal deposit for other tokens
            const tokenContract = new ethers.Contract(token.address, ERC20_ABI, signer);
            
            // First approve
            const approveTx = await tokenContract.approve(selectedDepositPool.address, amountWei);
            await approveTx.wait();
            
            // Then deposit
            const depositTx = await poolContract.deposit(amountWei);
            await depositTx.wait();
            alert('Deposit successful!');
        }

        // Update UI
        amountInput.value = '';
        await updateDepositTokenBalance();
        
    } catch (error) {
        console.error('Deposit error:', error);
        alert('Deposit failed: ' + error.message);
    }
}

// Execute withdraw transaction
async function handleWithdraw() {
    try {
        if (!selectedWithdrawPool || !currentAccount) {
            alert('Please select a pool and connect your wallet.');
            return;
        }
        
        const amount = document.getElementById('withdraw-amount').value;
        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount.');
            return;
        }
        
        // HTML element reference
        const withdrawButton = document.getElementById('withdraw-button');
        
        // Pool contract address
        const poolAddress = selectedWithdrawPool.address;
        
        console.log(`Starting withdrawal operation: ${selectedWithdrawPool.name} (${poolAddress})`);
        console.log(`Amount: ${amount}`);
        
        // Use 3 decimals for LP tokens as specified
        const LP_DECIMALS = 3;
        const amountInWei = ethers.utils.parseUnits(amount, LP_DECIMALS);

        console.log(`Amount to withdraw (wei): ${amountInWei.toString()} (using ${LP_DECIMALS} decimals)`);
        
        // Pool contract
        console.log("Calling pool contract...");
        const poolContract = new ethers.Contract(poolAddress, POOL_ABI, signer);
        
        // Execute withdraw
        withdrawButton.textContent = 'Transaction in Progress...';
        
        try {
            const withdrawTx = await poolContract.withdraw(amountInWei);
            console.log(`Withdraw transaction sent: ${withdrawTx.hash}`);
            
            // Wait for transaction to complete
            console.log("Waiting for withdraw transaction confirmation...");
            const receipt = await withdrawTx.wait();
            console.log(`Withdraw transaction completed: ${receipt.transactionHash}`);
            
            // Update UI
            document.getElementById('withdraw-amount').value = '';
            withdrawButton.textContent = 'Withdraw from Pool';
            
            // Update balances
            updateWithdrawTokenBalance();
            
            // If the same pool is selected in deposit tab, update that balance too
            if (selectedDepositPool && selectedDepositPool.token === selectedWithdrawPool.token) {
                updateDepositTokenBalance();
            }
            
            alert('Withdrawal completed successfully!');
        } catch (withdrawError) {
            console.error("Error during withdraw operation:", withdrawError);
            alert(`Withdrawal operation failed: ${withdrawError.message}`);
            withdrawButton.textContent = 'Withdraw from Pool';
        }
    } catch (error) {
        console.error('Error during withdrawal operation:', error);
        alert(`Withdrawal operation failed: ${error.message}`);
        document.getElementById('withdraw-button').textContent = 'Withdraw from Pool';
    }
}

// Get swap quote from AllBridge pool contract
async function getSwapQuote(fromToken, toToken, amount) {
    try {
        if (!fromToken || !toToken || !amount || !provider || amount <= 0) {
            return 0;
        }
        
        // Convert amount to wei
        const amountInWei = ethers.utils.parseUnits(amount.toString(), fromToken.decimals);
        
        // Get pool addresses
        const fromPoolAddress = POOLS[fromToken.symbol].address;
        const toPoolAddress = POOLS[toToken.symbol].address;
        
        // Create contract instances
        const fromPoolContract = new ethers.Contract(fromPoolAddress, POOL_ABI, provider);
        
        // Get fee share
        const feeShareBP = await fromPoolContract.feeShareBP();
        
        // Calculate fee
        const fee = amountInWei.mul(feeShareBP).div(10000);
        const amountAfterFee = amountInWei.sub(fee);
        
        // Convert to system precision (3 decimals)
        let systemPrecisionAmount;
        if (fromToken.decimals > 3) {
            systemPrecisionAmount = amountAfterFee.div(ethers.BigNumber.from(10).pow(fromToken.decimals - 3));
        } else if (fromToken.decimals < 3) {
            systemPrecisionAmount = amountAfterFee.mul(ethers.BigNumber.from(10).pow(3 - fromToken.decimals));
        } else {
            systemPrecisionAmount = amountAfterFee;
        }
        
        // Get pool states
        const [fromTokenBalance, fromVUsdBalance] = await Promise.all([
            fromPoolContract.tokenBalance(),
            fromPoolContract.vUsdBalance()
        ]);
        
        // Calculate vUSD amount using AMM formula
        const newFromTokenBalance = fromTokenBalance.add(systemPrecisionAmount);
        const newFromVUsdBalance = await fromPoolContract.getY(newFromTokenBalance);
        const vUsdAmount = fromVUsdBalance.sub(newFromVUsdBalance);
        
        // Now calculate TO pool swap (vUSD -> token)
        const toPoolContract = new ethers.Contract(toPoolAddress, POOL_ABI, provider);
        const [toTokenBalance, toVUsdBalance] = await Promise.all([
            toPoolContract.tokenBalance(),
            toPoolContract.vUsdBalance()
        ]);
        
        // Calculate final token amount
        const newToVUsdBalance = toVUsdBalance.add(vUsdAmount);
        const newToTokenBalance = await toPoolContract.getY(newToVUsdBalance);
        const systemPrecisionReceivedAmount = toTokenBalance.sub(newToTokenBalance);
        
        // Convert from system precision to token decimals
        let receivedTokenAmount;
        if (toToken.decimals > 3) {
            receivedTokenAmount = systemPrecisionReceivedAmount.mul(ethers.BigNumber.from(10).pow(toToken.decimals - 3));
        } else if (toToken.decimals < 3) {
            receivedTokenAmount = systemPrecisionReceivedAmount.div(ethers.BigNumber.from(10).pow(3 - toToken.decimals));
        } else {
            receivedTokenAmount = systemPrecisionReceivedAmount;
        }
        
        // Format for display with 3 decimals
        const formattedAmount = parseFloat(ethers.utils.formatUnits(receivedTokenAmount, toToken.decimals));
        return formattedAmount;
    } catch (error) {
        console.error('Error getting swap quote:', error);
        return 0;
    }
}

// Estimate gas cost for swap operation
async function estimateSwapGasCost(fromToken, toToken, amount) {
    try {
        if (!provider || !fromToken || !toToken || !amount || !currentAccount) {
            return "~0.0002 MON";
        }
        
        // Convert amount to wei
        const amountInWei = ethers.utils.parseUnits(amount.toString(), fromToken.decimals);
        
        // Determine which router to use
        const isMonTokens = ['aprMON', 'gMON', 'shMON', 'WMON'].includes(fromToken.symbol);
        const routerAddress = isMonTokens ? ROUTERS.MON : ROUTERS.USD;
        
        // Create router contract
        const routerContract = new ethers.Contract(routerAddress, ROUTER_ABI, provider);
        
        // Prepare swap parameters
        const fromTokenBytes32 = ethers.utils.hexZeroPad(fromToken.address, 32);
        const toTokenBytes32 = ethers.utils.hexZeroPad(toToken.address, 32);
        const minReceiveAmount = ethers.constants.Zero; // For gas estimation only
        
        // Try to estimate gas
        const gasEstimate = await routerContract.estimateGas.swap(
            amountInWei,
            fromTokenBytes32,
            toTokenBytes32,
            currentAccount,
            minReceiveAmount,
            { from: currentAccount }
        );
        
        // Gas price in GWEI
        const gasPrice = await provider.getGasPrice();
        
        // Calculate total cost in native token (MON)
        const totalCost = gasEstimate.mul(gasPrice);
        const formattedCost = ethers.utils.formatEther(totalCost);
        
        return `~${parseFloat(formattedCost).toFixed(6)} MON`;
    } catch (error) {
        console.error("Error estimating gas:", error);
        // Return default estimate if estimation fails
        return "~0.0002 MON";
    }
} 