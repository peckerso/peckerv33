# Pecker AllBridge Frontend

This project is a frontend application that interacts with AllBridge contracts on Monad Testnet using the Pecker design. You can perform Swap and Pool operations.

## Features

- MetaMask wallet connection
- Automatic switch to Monad Testnet network
- Swap operations
- Token deposit to pool
- Token withdrawal from pool
- Responsive design

## Contract Addresses

### Router Contracts
```
aprMON/gMON: 0xfB14b91bb664620c750BD3E42689008c6705f8d7
```

### Pool Contracts
```
aprMON Pool: 0x2C85ACEF5A8B1bE3A1382f0B4592FC5CD2ADa45E
gMON Pool: 0x2C85ACEF5A8B1bE3A1382f0B4592FC5CD2ADa45E
```

### Token Contracts
```
aprMON: 0x2C85ACEF5A8B1bE3A1382f0B4592FC5CD2ADa45E
gMON: 0x2C85ACEF5A8B1bE3A1382f0B4592FC5CD2ADa45E
```

## Installation and Running

1. Clone the project
```bash
git clone https://github.com/yourusername/pecker-allbridge.git
cd pecker-allbridge
```

2. Install dependencies (optional, this example requires no dependencies)
```bash
# No dependencies required
```

3. Run the project
```bash
# Run with a simple HTTP server
python3 -m http.server 8080
```

4. Go to `http://localhost:8080` in your browser

## Usage

1. Click "Connect" button to connect MetaMask
2. Switch to Monad Testnet if needed (will be suggested automatically)
3. To perform a swap:
   - Select "Swap" tab
   - Select the token you want to send
   - Select the token you want to receive
   - Enter amount and click "Swap" button
4. To deposit tokens to pool:
   - Select "Pool" tab
   - Select pool from "Deposit to Pool" card
   - Enter amount you want to deposit and click "Deposit" button
5. To withdraw tokens from pool:
   - Select "Pool" tab
   - Select pool from "Withdraw from Pool" card
   - Enter amount you want to withdraw and click "Withdraw" button

## Note

This application runs on Monad Testnet. Real tokens are not used. 