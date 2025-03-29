// Initialize the app when the DOM is fully loaded
console.log('PECKER app.js loaded');

// Import necessary functions
import { getBalance } from './services/wallet.js';
import { parseEther, formatUnits } from 'viem';

// Function to initialize the app
function initializeApp() {
    console.log('Initializing PECKER app...');
    
    // Get the appKit and wagmiAdapter from the global scope
    const appKit = window.appKit;
    const wagmiAdapter = window.wagmiAdapter;
    const store = window.store;
    
    console.log('AppKit:', appKit);
    console.log('WagmiAdapter:', wagmiAdapter);
    console.log('Store:', store);
    
    if (!appKit || !wagmiAdapter) {
        console.error('AppKit or WagmiAdapter not found. Make sure you are on the app.html page.');
        return;
    }
    
    // Flag to prevent multiple network switch requests
    let isNetworkSwitchInProgress = false;
    
    // Token and Pool Addresses from the old project
    const TOKENS = {
        // MON Tokens
        aprMON: {
            address: "0xb2f82D0f38dc453D596Ad40A37799446Cc89274A",
            symbol: "aprMON",
            name: "APR MON",
            decimals: 18,
            icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg"
        },
        gMON: {
            address: "0xaEef2f6B429Cb59C9B2D7bB2141ADa993E8571c3",
            symbol: "gMON", 
            name: "gMON",
            decimals: 18,
            icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg"
        },
        shMON: {
            address: "0x3a98250F98Dd388C211206983453837C8365BDc1",
            symbol: "shMON",
            name: "shMON",
            decimals: 18,
            icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg"
        },
        WMON: {
            address: "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701",
            symbol: "WMON",
            name: "Wrapped MON",
            decimals: 18,
            icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg"
        },
        // USD Tokens
        USDC: {
            address: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
            icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg"
        },
        USDT: {
            address: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D",
            symbol: "USDT",
            name: "Tether USD",
            decimals: 6,
            icon: "https://cryptologos.cc/logos/tether-usdt-logo.svg"
        }
    };

    // Pools from the old project
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

    // Router Addresses from the old project
    const ROUTERS = {
        MON: "0x889e739C6CdD73a5cd1c1a314124bf4182fb1281", // MON Router address
        USD: "0xE28bDCEDb128383142b5a00C5c957004E49D426a"  // USD Router address
    };

    // ABI definitions from the old project
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

    // State variables for token selection
    let selectedFromToken = null;
    let selectedToToken = null;
    let selectedDepositPool = null;
    let selectedWithdrawPool = null;
    
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

    // Function to check if we're on Monad Testnet
    function isMonadTestnet() {
        const chainId = store.networkState?.chainId;
        return chainId === 10143;
    }

    // Function to check if wallet is connected
    function isWalletConnected() {
        const isConnected = !!store.accountState?.address;
        return isConnected;
    }

    // Function to update the notification message
    function updateNotificationMessage(message) {
        const notification = document.querySelector('.notification');
        if (notification) {
            notification.style.display = 'block';
            
            // Update notification message
            const notificationMessages = notification.querySelectorAll('.notification-message');
            if (notificationMessages.length > 0) {
                notificationMessages[0].textContent = message;
                if (notificationMessages.length > 1) {
                    notificationMessages[1].style.display = 'block';
                }
            }
        }
    }

    // Function to check if we need to switch to Monad Testnet
    async function checkAndSwitchNetwork() {
        if (isWalletConnected() && !isMonadTestnet() && !isNetworkSwitchInProgress) {
            // Set flag to prevent multiple requests
            isNetworkSwitchInProgress = true;
            
            try {
                // Update notification message
                updateNotificationMessage('Please switch to Monad Testnet. Your connected wallet may not support some of the networks available for this dApp. Please switch to Monad Testnet.');
                
                // Open the Networks view
                await appKit.open({ view: 'Networks' });
                
                // Reset the flag after a delay to allow for user interaction
                setTimeout(() => {
                    isNetworkSwitchInProgress = false;
                }, 3000);
                
                return true;
            } catch (error) {
                console.error('Error switching network:', error);
                
                // Reset the flag
                isNetworkSwitchInProgress = false;
                
                // Show an error message to the user
                updateNotificationMessage('Network switch declined. Your connected wallet may not support some of the networks available for this dApp. Please switch to Monad Testnet.');
                
                return false;
            }
        }
        return false;
    }

    // Update button states based on wallet and network status
    function updateButtonStates() {
        // First check if we're on Monad Testnet
        const onMonadTestnet = isMonadTestnet();
        
        const swapButton = document.getElementById('swap-button');
        const depositButton = document.getElementById('deposit-button');
        const withdrawButton = document.getElementById('withdraw-button');
        
        if (swapButton) {
            if (!onMonadTestnet) {
                // If not on Monad Testnet, show "Switch to Monad Testnet" regardless of wallet connection
                swapButton.disabled = false;
                swapButton.textContent = 'Switch to Monad Testnet';
            } else if (!isWalletConnected()) {
                // If on Monad Testnet but wallet not connected, show "Connect Wallet"
                swapButton.disabled = false;
                swapButton.textContent = 'Connect Wallet';
            } else {
                // If on Monad Testnet and wallet connected, show "Swap"
                swapButton.disabled = false;
                swapButton.textContent = 'Swap';
            }
        }
        
        if (depositButton) {
            if (!onMonadTestnet) {
                depositButton.disabled = false;
                depositButton.textContent = 'Switch to Monad Testnet';
            } else if (!isWalletConnected()) {
                depositButton.disabled = false;
                depositButton.textContent = 'Connect Wallet';
            } else {
                depositButton.disabled = false;
                depositButton.textContent = 'Deposit';
            }
        }
        
        if (withdrawButton) {
            if (!onMonadTestnet) {
                withdrawButton.disabled = false;
                withdrawButton.textContent = 'Switch to Monad Testnet';
            } else if (!isWalletConnected()) {
                withdrawButton.disabled = false;
                withdrawButton.textContent = 'Connect Wallet';
            } else {
                withdrawButton.disabled = false;
                withdrawButton.textContent = 'Withdraw';
            }
        }
    }

    // Event listeners for Token Selectors
    const fromTokenSelector = document.getElementById('from-token-selector');
    const fromTokenDropdown = document.getElementById('from-token-dropdown');
    const toTokenSelector = document.getElementById('to-token-selector');
    const toTokenDropdown = document.getElementById('to-token-dropdown');

    // Populate token lists
    populateTokenLists();

    // From token selector
    if (fromTokenSelector) {
        fromTokenSelector.addEventListener('click', () => {
            fromTokenDropdown.classList.toggle('show');
            if (toTokenDropdown.classList.contains('show')) {
                toTokenDropdown.classList.remove('show');
            }
        });
    }

    // To token selector
    if (toTokenSelector) {
        toTokenSelector.addEventListener('click', () => {
            toTokenDropdown.classList.toggle('show');
            if (fromTokenDropdown.classList.contains('show')) {
                fromTokenDropdown.classList.remove('show');
            }
        });
    }

    // Event listeners for Pool Selectors
    const depositPoolSelect = document.getElementById('deposit-pool-select');
    const withdrawPoolSelect = document.getElementById('withdraw-pool-select');

    // Populate pool lists
    if (depositPoolSelect) {
        populatePoolLists(depositPoolSelect);
        
        // Listen for pool selections
        depositPoolSelect.addEventListener('change', async (e) => {
            const poolKey = e.target.value;
            selectedDepositPool = POOLS[poolKey];
            if (selectedDepositPool && isWalletConnected()) {
                await updateDepositTokenBalance();
            }
        });
    }

    if (withdrawPoolSelect) {
        populatePoolLists(withdrawPoolSelect);
        
        // Listen for pool selections
        withdrawPoolSelect.addEventListener('change', async (e) => {
            const poolKey = e.target.value;
            selectedWithdrawPool = POOLS[poolKey];
            if (selectedWithdrawPool && isWalletConnected()) {
                await updateWithdrawTokenBalance();
            }
        });
    }

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
    if (fromAmountInput) {
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
    }

    // Set up button click handlers
    const swapButton = document.getElementById('swap-button');
    if (swapButton) {
        swapButton.addEventListener('click', async () => {
            // First check if we're on Monad Testnet
            if (!isMonadTestnet()) {
                if (!isNetworkSwitchInProgress) {
                    try {
                        // Update notification message
                        updateNotificationMessage('Please switch to Monad Testnet. Your connected wallet may not support some of the networks available for this dApp. Please switch to Monad Testnet.');
                        
                        await appKit.open({ view: 'Networks' });
                        
                        // Set flag to prevent multiple requests
                        isNetworkSwitchInProgress = true;
                        
                        // Reset the flag after a delay
                        setTimeout(() => {
                            isNetworkSwitchInProgress = false;
                        }, 3000);
                    } catch (error) {
                        console.error('Error opening network switcher:', error);
                        isNetworkSwitchInProgress = false;
                        
                        // Show an error message to the user
                        updateNotificationMessage('Network switch declined. Your connected wallet may not support some of the networks available for this dApp. Please switch to Monad Testnet.');
                    }
                }
                return;
            }
            
            // Then check if wallet is connected
            if (!isWalletConnected()) {
                appKit.open();
                return;
            }
            
            // If both conditions are met, proceed with swap
            await handleSwap();
        });
    }

    const depositButton = document.getElementById('deposit-button');
    if (depositButton) {
        depositButton.addEventListener('click', async () => {
            // First check if we're on Monad Testnet
            if (!isMonadTestnet()) {
                if (!isNetworkSwitchInProgress) {
                    try {
                        // Update notification message
                        updateNotificationMessage('Please switch to Monad Testnet. Your connected wallet may not support some of the networks available for this dApp. Please switch to Monad Testnet.');
                        
                        await appKit.open({ view: 'Networks' });
                        
                        // Set flag to prevent multiple requests
                        isNetworkSwitchInProgress = true;
                        
                        // Reset the flag after a delay
                        setTimeout(() => {
                            isNetworkSwitchInProgress = false;
                        }, 3000);
                    } catch (error) {
                        console.error('Error opening network switcher:', error);
                        isNetworkSwitchInProgress = false;
                        
                        // Show an error message to the user
                        updateNotificationMessage('Network switch declined. Your connected wallet may not support some of the networks available for this dApp. Please switch to Monad Testnet.');
                    }
                }
                return;
            }
            
            // Then check if wallet is connected
            if (!isWalletConnected()) {
                appKit.open();
                return;
            }
            
            // If both conditions are met, proceed with deposit
            await handleDeposit();
        });
    }

    const withdrawButton = document.getElementById('withdraw-button');
    if (withdrawButton) {
        withdrawButton.addEventListener('click', async () => {
            // First check if we're on Monad Testnet
            if (!isMonadTestnet()) {
                if (!isNetworkSwitchInProgress) {
                    try {
                        // Update notification message
                        updateNotificationMessage('Please switch to Monad Testnet. Your connected wallet may not support some of the networks available for this dApp. Please switch to Monad Testnet.');
                        
                        await appKit.open({ view: 'Networks' });
                        
                        // Set flag to prevent multiple requests
                        isNetworkSwitchInProgress = true;
                        
                        // Reset the flag after a delay
                        setTimeout(() => {
                            isNetworkSwitchInProgress = false;
                        }, 3000);
                    } catch (error) {
                        console.error('Error opening network switcher:', error);
                        isNetworkSwitchInProgress = false;
                        
                        // Show an error message to the user
                        updateNotificationMessage('Network switch declined. Your connected wallet may not support some of the networks available for this dApp. Please switch to Monad Testnet.');
                    }
                }
                return;
            }
            
            // Then check if wallet is connected
            if (!isWalletConnected()) {
                appKit.open();
                return;
            }
            
            // If both conditions are met, proceed with withdraw
            await handleWithdraw();
        });
    }
    
    // Wallet connection button
    const connectWalletButton = document.getElementById('connect-wallet');
    if (connectWalletButton) {
        connectWalletButton.addEventListener('click', () => {
            appKit.open();
        });
    }

    // Subscribe to account changes
    appKit.subscribeAccount((account) => {
        // Update UI
        const walletStatus = document.getElementById('wallet-status');
        if (walletStatus && account && account.address) {
            walletStatus.textContent = `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
        } else if (walletStatus) {
            walletStatus.textContent = 'Connect';
        }
        
        // Update button states
        updateButtonStates();
        
        // Check if we need to switch to Monad Testnet
        if (!isNetworkSwitchInProgress) {
            checkAndSwitchNetwork().catch(error => {
                console.error('Error in checkAndSwitchNetwork:', error);
            });
        }
    });
    
    // Subscribe to network changes
    appKit.subscribeNetwork((network) => {
        // Update notification based on network
        if (!isMonadTestnet()) {
            // Show notification with custom message
            updateNotificationMessage('Please switch to Monad Testnet. Your connected wallet may not support some of the networks available for this dApp. Please switch to Monad Testnet.');
            
            // If wallet is connected, open network switcher
            if (!isNetworkSwitchInProgress) {
                checkAndSwitchNetwork().catch(error => {
                    console.error('Error in checkAndSwitchNetwork:', error);
                });
            }
        } else {
            // Hide notification
            const notification = document.querySelector('.notification');
            if (notification) {
                notification.style.display = 'none';
            }
            
            // Reset the network switch flag
            isNetworkSwitchInProgress = false;
        }
        
        // Update button states
        updateButtonStates();
    });
    
    // Initial update of button states
    updateButtonStates();
    
    // Initial check for network
    if (!isNetworkSwitchInProgress) {
        checkAndSwitchNetwork().catch(error => {
            console.error('Error in initial checkAndSwitchNetwork:', error);
        });
    }

    // Populate token lists
    function populateTokenLists() {
        const fromTokenList = document.getElementById('from-token-list');
        const toTokenList = document.getElementById('to-token-list');

        if (!fromTokenList || !toTokenList) return;

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
                if (isWalletConnected()) {
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
                if (isWalletConnected()) {
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

    // Update token balance
    async function updateTokenBalance(token, elementId) {
        try {
            if (!isWalletConnected()) return;
            
            const provider = store.eip155Provider;
            const address = store.accountState.address;
            
            // Call balanceOf function
            const balanceResult = await provider.request({
                method: 'eth_call',
                params: [{
                    to: token.address,
                    data: '0x70a08231' + '000000000000000000000000' + address.slice(2) // balanceOf(address) function signature + padded address
                }, 'latest']
            });
            
            // Parse the result
            const balance = BigInt(balanceResult);
            const formattedBalance = formatUnits(balance, token.decimals);
            
            document.getElementById(elementId).textContent = parseFloat(formattedBalance).toFixed(4);
        } catch (error) {
            console.error('Error updating balance:', error);
        }
    }

    // Update deposit token balance
    async function updateDepositTokenBalance() {
        if (!selectedDepositPool || !isWalletConnected()) return;

        const token = TOKENS[selectedDepositPool.token];
        const balanceElement = document.getElementById('deposit-token-balance');

        try {
            if (selectedDepositPool.token === 'WMON') {
                // WMON token balance
                const provider = store.eip155Provider;
                const address = store.accountState.address;
                
                // Get WMON balance
                const wmonBalanceResult = await provider.request({
                    method: 'eth_call',
                    params: [{
                        to: token.address,
                        data: '0x70a08231' + '000000000000000000000000' + address.slice(2) // balanceOf(address) function signature + padded address
                    }, 'latest']
                });
                
                // Get native MON balance
                const nativeBalanceResult = await provider.request({
                    method: 'eth_getBalance',
                    params: [address, 'latest']
                });
                
                // Parse the results
                const wmonBalance = BigInt(wmonBalanceResult);
                const nativeBalance = BigInt(nativeBalanceResult);
                
                // Total balance (WMON + native MON)
                const totalBalance = wmonBalance + nativeBalance;
                
                // Show balance
                const formattedBalance = formatUnits(totalBalance, token.decimals);
                balanceElement.textContent = parseFloat(formattedBalance).toFixed(4);
            } else {
                // Normal balance display for other tokens
                await updateTokenBalance(token, 'deposit-token-balance');
            }
        } catch (error) {
            console.error('Balance update error:', error);
            balanceElement.textContent = '0.0000';
        }
    }

    // Update withdraw token balance
    async function updateWithdrawTokenBalance() {
        if (!selectedWithdrawPool || !isWalletConnected()) return;

        try {
            const provider = store.eip155Provider;
            const address = store.accountState.address;
            
            // Get the pool contract to check LP token balance
            const poolAddress = selectedWithdrawPool.address;
            
            // Call balanceOf function
            const balanceResult = await provider.request({
                method: 'eth_call',
                params: [{
                    to: poolAddress,
                    data: '0x70a08231' + '000000000000000000000000' + address.slice(2) // balanceOf(address) function signature + padded address
                }, 'latest']
            });
            
            // Parse the result
            const lpBalance = BigInt(balanceResult);
            
            // Use 3 decimals for LP tokens as specified
            const LP_DECIMALS = 3;
            const formattedBalance = formatUnits(lpBalance, LP_DECIMALS);
            
            // Update the displayed balance
            document.getElementById('withdraw-token-balance').textContent = parseFloat(formattedBalance).toFixed(4);
        } catch (error) {
            console.error('Error fetching LP token balance:', error);
            document.getElementById('withdraw-token-balance').textContent = "0.0000";
        }
    }

    // Execute swap transaction
    async function handleSwap() {
        try {
            if (!selectedFromToken || !selectedToToken || !isWalletConnected()) {
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
            
            // Get the provider and signer from AppKit
            const provider = store.eip155Provider;
            const address = store.accountState.address;
            
            // Convert amount to token's decimal
            const amountInWei = parseEther(amount);
            
            // First check allowance
            console.log("Checking allowance...");
            const allowanceResult = await provider.request({
                method: 'eth_call',
                params: [{
                    to: selectedFromToken.address,
                    data: '0xdd62ed3e' + // allowance(address,address) function signature
                          '000000000000000000000000' + address.slice(2) + // owner parameter (padded address)
                          '000000000000000000000000' + routerAddress.slice(2) // spender parameter (padded address)
                }, 'latest']
            });
            
            const allowance = BigInt(allowanceResult);
            console.log(`Current allowance: ${formatUnits(allowance, selectedFromToken.decimals)}`);
            
            // If no allowance or insufficient, get token approval
            if (allowance < amountInWei) {
                console.log("Allowance needed, starting approve process...");
                
                // Inform user about token spending approval
                alert("You need to give approval (approve) for the router contract to use your tokens. Your wallet will open and ask you to complete the approval process.");
                
                swapButton.textContent = 'Waiting for Approval...';
                
                // Update the gas estimate for approval (rough estimate)
                document.getElementById('gas-estimate-value').textContent = "~0.0003 MON (approval)";
                
                try {
                    // Token approval (approve) operation
                    const approveResult = await provider.request({
                        method: 'eth_sendTransaction',
                        params: [{
                            from: address,
                            to: selectedFromToken.address,
                            data: '0x095ea7b3' + // approve(address,uint256) function signature
                                  '000000000000000000000000' + routerAddress.slice(2) + // spender parameter (padded address)
                                  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' // amount parameter (max uint256)
                        }]
                    });
                    
                    console.log(`Approval transaction sent: ${approveResult}`);
                    
                    // Wait for transaction confirmation
                    alert("Please wait for the approval transaction to be confirmed before proceeding with the swap.");
                    
                    // Wait for the approval to be confirmed
                    let approvalConfirmed = false;
                    let retries = 0;
                    const maxRetries = 5;
                    
                    while (!approvalConfirmed && retries < maxRetries) {
                        retries++;
                        
                        // Wait a bit for the transaction to be processed
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        // Check allowance again
                        const newAllowanceResult = await provider.request({
                            method: 'eth_call',
                            params: [{
                                to: selectedFromToken.address,
                                data: '0xdd62ed3e' + // allowance(address,address) function signature
                                      '000000000000000000000000' + address.slice(2) + // owner parameter (padded address)
                                      '000000000000000000000000' + routerAddress.slice(2) // spender parameter (padded address)
                            }, 'latest']
                        });
                        
                        const newAllowance = BigInt(newAllowanceResult);
                        console.log(`Updated allowance check (attempt ${retries}): ${formatUnits(newAllowance, selectedFromToken.decimals)}`);
                        
                        if (newAllowance >= amountInWei) {
                            approvalConfirmed = true;
                            console.log("Approval confirmed, proceeding with swap");
                        }
                    }
                    
                    if (!approvalConfirmed) {
                        console.warn("Approval may not be confirmed yet, but proceeding with swap attempt");
                    }
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
            
            // Prepare parameters for swap operation
            // Set minimum receive amount to 0 (no slippage protection)
            const minReceiveAmount = BigInt(0);
            
            console.log(`From Token Address: ${selectedFromToken.address}`);
            console.log(`To Token Address: ${selectedToToken.address}`);
            console.log(`Amount: ${amount} (${amountInWei.toString()} wei)`);
            console.log(`Minimum To Receive: 0 (no slippage protection)`);
            
            // Execute swap
            swapButton.textContent = 'Transaction in Progress...';
            
            try {
                // Prepare parameters for swap operation
                // Format token addresses as bytes32 (using the correct format from the old app)
                // This pads the address to 32 bytes (64 hex characters)
                const fromTokenBytes32 = '0x' + '000000000000000000000000' + selectedFromToken.address.slice(2);
                const toTokenBytes32 = '0x' + '000000000000000000000000' + selectedToToken.address.slice(2);
                
                console.log(`From Token Bytes32: ${fromTokenBytes32}`);
                console.log(`To Token Bytes32: ${toTokenBytes32}`);
                
                // Encode the swap function call based on the actual transaction data from the blockchain
                // Function signature: swap(uint256 amount, bytes32 token, bytes32 receiveToken, address recipient, uint256 receiveAmountMin)
                const methodId = '0x331838b2'; // Correct method ID from the blockchain explorer
                
                // Encode parameters exactly as seen in the successful transaction
                const encodedAmount = amountInWei.toString(16).padStart(64, '0');
                
                // IMPORTANT: The order of parameters is:
                // 1. amount
                // 2. token (the token you're SENDING - FROM token)
                // 3. receiveToken (the token you're RECEIVING - TO token)
                // 4. recipient (your address)
                // 5. receiveAmountMin (minimum amount to receive)
                
                // For bytes32 token addresses, pad to 32 bytes (20 bytes address with 12 bytes of padding)
                const encodedFromToken = '000000000000000000000000' + selectedFromToken.address.slice(2);
                const encodedToToken = '000000000000000000000000' + selectedToToken.address.slice(2);
                const encodedRecipient = '000000000000000000000000' + address.slice(2);
                const encodedMinReceiveAmount = minReceiveAmount.toString(16).padStart(64, '0');
                
                // Construct the full data payload in the correct order
                const swapData = methodId + 
                                 encodedAmount + 
                                 encodedFromToken +  // FROM token (sending)
                                 encodedToToken + // TO token (receiving)
                                 encodedRecipient + 
                                 encodedMinReceiveAmount;
                
                console.log('Swap data payload:', swapData);
                
                // Send the transaction
                const swapResult = await provider.request({
                    method: 'eth_sendTransaction',
                    params: [{
                        from: address,
                        to: routerAddress,
                        data: swapData
                    }]
                });
                
                console.log(`Swap transaction sent: ${swapResult}`);
                
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
                
                alert('Swap transaction sent! Please check your wallet for confirmation.');
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
            if (!isWalletConnected()) {
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
            const poolAddress = selectedDepositPool.address;
            const address = store.accountState.address;
            const provider = store.eip155Provider;
            
            // Convert amount to token's decimal
            const amountWei = parseEther(amount);

            // Deposit with native MON for WMON
            if (selectedDepositPool.token === 'WMON') {
                console.log('Depositing to WMON pool:', selectedDepositPool.address);
                console.log('Amount in wei:', amountWei.toString());
                
                // Encode the deposit function call
                const depositData = '0xb6b55f25' + // deposit(uint256) function signature
                                  amountWei.toString(16).padStart(64, '0'); // amount parameter
                
                // Send native MON directly to pool
                const depositResult = await provider.request({
                    method: 'eth_sendTransaction',
                    params: [{
                        from: address,
                        to: poolAddress,
                        value: '0x' + amountWei.toString(16),
                        data: depositData
                    }]
                });
                
                console.log('Transaction sent:', depositResult);
                alert('Deposit transaction sent! Please check your wallet for confirmation.');
            } else {
                // Normal deposit for other tokens
                // First approve
                console.log("Checking allowance...");
                const allowanceResult = await provider.request({
                    method: 'eth_call',
                    params: [{
                        to: token.address,
                        data: '0xdd62ed3e' + // allowance(address,address) function signature
                              '000000000000000000000000' + address.slice(2) + // owner parameter (padded address)
                              '000000000000000000000000' + poolAddress.slice(2) // spender parameter (padded address)
                    }, 'latest']
                });
                
                const allowance = BigInt(allowanceResult);
                console.log(`Current allowance: ${formatUnits(allowance, token.decimals)}`);
                
                // If no allowance or insufficient, get token approval
                if (allowance < amountWei) {
                    console.log("Allowance needed, starting approve process...");
                    
                    // Inform user about token spending approval
                    alert("You need to give approval (approve) for the pool contract to use your tokens. Your wallet will open and ask you to complete the approval process.");
                    
                    try {
                        // Token approval (approve) operation
                        const approveResult = await provider.request({
                            method: 'eth_sendTransaction',
                            params: [{
                                from: address,
                                to: token.address,
                                data: '0x095ea7b3' + // approve(address,uint256) function signature
                                      '000000000000000000000000' + poolAddress.slice(2) + // spender parameter (padded address)
                                      'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' // amount parameter (max uint256)
                            }]
                        });
                        
                        console.log(`Approval transaction sent: ${approveResult}`);
                        
                        // Wait for transaction confirmation
                        alert("Please wait for the approval transaction to be confirmed before proceeding with the deposit.");
                        
                        // Wait for the approval to be confirmed
                        let approvalConfirmed = false;
                        let retries = 0;
                        const maxRetries = 5;
                        
                        while (!approvalConfirmed && retries < maxRetries) {
                            retries++;
                            
                            // Wait a bit for the transaction to be processed
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            
                            // Check allowance again
                            const newAllowanceResult = await provider.request({
                                method: 'eth_call',
                                params: [{
                                    to: token.address,
                                    data: '0xdd62ed3e' + // allowance(address,address) function signature
                                          '000000000000000000000000' + address.slice(2) + // owner parameter (padded address)
                                          '000000000000000000000000' + poolAddress.slice(2) // spender parameter (padded address)
                                }, 'latest']
                            });
                            
                            const newAllowance = BigInt(newAllowanceResult);
                            console.log(`Updated allowance check (attempt ${retries}): ${formatUnits(newAllowance, token.decimals)}`);
                            
                            if (newAllowance >= amountWei) {
                                approvalConfirmed = true;
                                console.log("Approval confirmed, proceeding with deposit");
                            }
                        }
                        
                        if (!approvalConfirmed) {
                            console.warn("Approval may not be confirmed yet, but proceeding with deposit attempt");
                        }
                    } catch (approveError) {
                        console.error("Error during approval process:", approveError);
                        alert(`Error during token approval: ${approveError.message}`);
                        return;
                    }
                }
                
                // Then deposit
                // Encode the deposit function call
                const depositData = '0xb6b55f25' + // deposit(uint256) function signature
                                  amountWei.toString(16).padStart(64, '0'); // amount parameter
                
                const depositResult = await provider.request({
                    method: 'eth_sendTransaction',
                    params: [{
                        from: address,
                        to: poolAddress,
                        data: depositData
                    }]
                });
                
                console.log('Transaction sent:', depositResult);
                alert('Deposit transaction sent! Please check your wallet for confirmation.');
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
            if (!selectedWithdrawPool || !isWalletConnected()) {
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
            const address = store.accountState.address;
            const provider = store.eip155Provider;
            
            console.log(`Starting withdrawal operation: ${selectedWithdrawPool.name} (${poolAddress})`);
            console.log(`Amount: ${amount}`);
            
            // Use 3 decimals for LP tokens as specified
            const LP_DECIMALS = 3;
            
            // Convert amount to wei with 3 decimals (not 18)
            // For example, 0.18 LP tokens should be 180 wei (0.18 * 10^3)
            const amountInWei = BigInt(Math.floor(parseFloat(amount) * 10 ** LP_DECIMALS));

            console.log(`Amount to withdraw (wei): ${amountInWei.toString()} (using ${LP_DECIMALS} decimals)`);
            
            // Execute withdraw
            withdrawButton.textContent = 'Transaction in Progress...';
            
            try {
                // Encode the withdraw function call
                const withdrawData = '0x2e1a7d4d' + // withdraw(uint256) function signature
                               amountInWei.toString(16).padStart(64, '0'); // amount parameter
                
                const withdrawResult = await provider.request({
                    method: 'eth_sendTransaction',
                    params: [{
                        from: address,
                        to: poolAddress,
                        data: withdrawData
                    }]
                });
                
                console.log(`Withdraw transaction sent: ${withdrawResult}`);
                
                // Update UI
                document.getElementById('withdraw-amount').value = '';
                withdrawButton.textContent = 'Withdraw from Pool';
                
                // Update balances
                updateWithdrawTokenBalance();
                
                // If the same pool is selected in deposit tab, update that balance too
                if (selectedDepositPool && selectedDepositPool.token === selectedWithdrawPool.token) {
                    updateDepositTokenBalance();
                }
                
                alert('Withdrawal transaction sent! Please check your wallet for confirmation.');
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
}

// Call the initialize function when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM already loaded, call the function directly
    initializeApp();
}
