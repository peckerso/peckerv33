import { appKit, wagmiAdapter } from './config/appKit'
import { store } from './store/appkitStore'
import { updateTheme, updateButtonVisibility } from './utils/dom'
import { signMessage, sendTx, getBalance } from './services/wallet'
import { initializeSubscribers } from './utils/suscribers'
import { mainnet, polygon } from '@reown/appkit/networks'

// Initialize subscribers
initializeSubscribers(appKit)

// Initial check
updateButtonVisibility(appKit.getIsConnectedState());

// Check if we're on the app page (now index.html)
if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
  // Use the appKit and wagmiAdapter for the PECKER app
  console.log('PECKER app page detected');
  
  // Make appKit and wagmiAdapter available globally for the app.html page
  window.appKit = appKit;
  window.wagmiAdapter = wagmiAdapter;
  window.store = store;
  
  // Import the app.js file after making the appKit and wagmiAdapter objects available globally
  import('./app.js').then(() => {
    console.log('PECKER app loaded successfully');
  }).catch(error => {
    console.error('Error loading PECKER app:', error);
  });
} else {
  // Button event listeners for the main page
  document.getElementById('open-connect-modal')?.addEventListener(
    'click', () => appKit.open()
  )

  document.getElementById('disconnect')?.addEventListener(
    'click', () => {
      appKit.disconnect()
    }
  )

  document.getElementById('switch-network')?.addEventListener(
    'click', () => {
      const currentChainId = store.networkState?.chainId
      appKit.switchNetwork(currentChainId === polygon.id ? mainnet : polygon)
    }
  )

  document.getElementById('sign-message')?.addEventListener(
    'click', async () => {
      const signature = await signMessage(store.eip155Provider, store.accountState.address)

      document.getElementById('signatureState').innerHTML = signature
      document.getElementById('signatureSection').style.display = ''
    }
  )

  document.getElementById('send-tx')?.addEventListener(
    'click', async () => {
      const tx = await sendTx(store.eip155Provider, store.accountState.address, wagmiAdapter.wagmiConfig)
      

      document.getElementById('txState').innerHTML = JSON.stringify(tx, null, 2)
      document.getElementById('txSection').style.display = ''
    }
  )

  document.getElementById('get-balance')?.addEventListener(
    'click', async () => {
      const balance = await getBalance(store.eip155Provider, store.accountState.address, wagmiAdapter.wagmiConfig)
      
      document.getElementById('balanceState').innerHTML = balance + ' ETH'
      document.getElementById('balanceSection').style.display = ''
    }
  )
}

// Set initial theme
updateTheme(store.themeState.themeMode)
