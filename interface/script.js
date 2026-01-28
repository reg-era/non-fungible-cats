import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.8.0/dist/ethers.esm.min.js'

// Global state
let provider = null;
let signer = null;
let contract = null;
let account = "";
let tokens = [];

// Contract configuration (loaded from napping_cats_contract.js)
let CONTRACT_ADDRESS;
let CONTRACT_ABI;

// Token data (loaded from token_data.js)
const tokenDataMap = {};

const loadDappData = async () => {
    try {
        const res = await fetch("/napping_cats_contract.json")
        const data = await res.json()
        CONTRACT_ADDRESS = data.address;
        CONTRACT_ABI = data.abi;
    } catch (error) {
        console.error(error);
        alert("Smart contract adress not found")
    }

    const getNFT = async (uri) => {
        try {
            const res = await fetch(`/NFTs/${uri}`)
            const data = await res.json()
            tokenDataMap[uri] = data
        } catch (error) {
            console.error(error);
            alert("Smart contract adress not found")
        }
    }

    ['0.json', '1.json', '2.json'].forEach(async nft => await getNFT(nft))
}

// DOM Elements
const connectBtn = document.getElementById('connectBtn');
const connectBtnText = document.getElementById('connectBtnText');
const walletInfo = document.getElementById('walletInfo');
const walletAddress = document.getElementById('walletAddress');
const welcomeSection = document.getElementById('welcomeSection');
const marketplaceSection = document.getElementById('marketplaceSection');
const nftGrid = document.getElementById('nftGrid');
const txStatus = document.getElementById('txStatus');
const txStatusText = document.getElementById('txStatusText');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadDappData();
    connectBtn.addEventListener('click', connectWallet);
});

// Connect Wallet
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask to use this dApp');
        return;
    }

    try {
        connectBtnText.textContent = 'Connecting...';
        connectBtn.disabled = true;

        // Switch to local network (chainId 0x7a69 = 31337)
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x7a69' }]
            });
        } catch (error) {
            console.log('Chain switch error:', error);
        }

        // Create provider and signer
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        account = await signer.getAddress();

        // Create contract instance
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        // Update UI
        walletAddress.textContent = `${account.slice(0, 6)}...${account.slice(-4)}`;
        connectBtn.style.display = 'none';
        walletInfo.style.display = 'block';
        welcomeSection.style.display = 'none';
        marketplaceSection.classList.add('show');

        // Load tokens
        await loadTokens();
    } catch (error) {
        // console.error('Failed to connect wallet:', error);
        alert('Failed to connect wallet');
        connectBtnText.textContent = 'Connect Wallet';
        connectBtn.disabled = false;
    }
}

// Load tokens from contract
async function loadTokens() {
    tokens = [];
    nftGrid.innerHTML = '';

    for (let id = 0; id < 3; id++) {
        try {
            const uri = await contract.tokenURI(id);
            const owner = await contract.ownerOf(id);
            let price = undefined;

            try {
                const listedPrice = await contract.listedPrice(id);
                if (listedPrice.gt(0)) {
                    price = ethers.utils.formatEther(listedPrice);
                }
            } catch (error) {
                console.log(`No price for token ${id}`);
            }

            const token = { id, uri, owner, price };
            tokens.push(token);
            renderToken(token, id);
        } catch (error) {
            console.error(`Failed to load token ${id}:`, error);
        }
    }
}

// Render a single token card
function renderToken(token, index) {
    const tokenData = tokenDataMap[token.uri] || {};
    const isOwner = token.owner.toLowerCase() === account.toLowerCase();

    const card = document.createElement('div');
    card.className = 'nft-card';
    card.style.animationDelay = `${index * 0.1}s`;

    card.innerHTML = `
        <div class="nft-image-container">
            ${tokenData.token_image_uri ? `<img src="${tokenData.token_image_uri}" alt="NFT #${token.id}" class="nft-image">` : ''}
            <div class="nft-image-placeholder">
                <span class="nft-id">#${index}</span>
            </div>
            ${token.price ? `<div class="price-badge">${token.price} wei</div>` : ''}
        </div>

        <div class="nft-details">
            <div class="nft-header">
                <h3 class="nft-title">Napping Cat #${token.id}</h3>
                <div class="nft-uri">${tokenData.token_name || 'Unknown'}</div>
            </div>

            <div class="nft-owner">
                <span class="owner-label">Owner</span>
                <span class="owner-address">${token.owner.slice(0, 6)}...${token.owner.slice(-4)}</span>
            </div>

            <div class="nft-actions" id="actions-${token.id}">
                ${isOwner ? renderOwnerActions(token.id) : renderBuyerActions(token.id, token.price)}
            </div>
        </div>
    `;

    nftGrid.appendChild(card);
    attachEventListeners(token.id, isOwner);
}

// Render actions for owner
function renderOwnerActions(tokenId) {
    return `
        <div class="owner-actions">
            <div class="sell-section" id="sell-section-${tokenId}">
                <div class="input-group">
                    <input type="text" class="price-input" id="price-input-${tokenId}" placeholder="0.00">
                </div>
                <button class="action-btn sell-btn" id="list-btn-${tokenId}">List for Sale</button>
            </div>

            <div class="transfer-section hidden" id="transfer-section-${tokenId}">
                <div class="input-group">
                    <input type="text" class="transfer-input" id="transfer-input-${tokenId}" placeholder="0x...">
                </div>
                <button class="action-btn transfer-btn" id="transfer-btn-${tokenId}">Send NFT</button>
            </div>

            <button class="toggle-btn" id="toggle-btn-${tokenId}">Gift NFT</button>
        </div>
    `;
}

// Render actions for buyer
function renderBuyerActions(tokenId, price) {
    return `
        <button class="action-btn buy-btn" id="buy-btn-${tokenId}">
            Buy Now${price ? ` ${price}` : ''}
        </button>
    `;
}

// Attach event listeners to buttons
function attachEventListeners(tokenId, isOwner) {
    if (isOwner) {
        const listBtn = document.getElementById(`list-btn-${tokenId}`);
        const transferBtn = document.getElementById(`transfer-btn-${tokenId}`);
        const toggleBtn = document.getElementById(`toggle-btn-${tokenId}`);

        listBtn.addEventListener('click', () => listToken(tokenId));
        transferBtn.addEventListener('click', () => transferToken(tokenId));
        toggleBtn.addEventListener('click', () => toggleMode(tokenId));
    } else {
        const buyBtn = document.getElementById(`buy-btn-${tokenId}`);
        buyBtn.addEventListener('click', () => buyToken(tokenId));
    }
}

// Toggle between sell and transfer mode
function toggleMode(tokenId) {
    const sellSection = document.getElementById(`sell-section-${tokenId}`);
    const transferSection = document.getElementById(`transfer-section-${tokenId}`);
    const toggleBtn = document.getElementById(`toggle-btn-${tokenId}`);

    if (sellSection.classList.contains('hidden')) {
        sellSection.classList.remove('hidden');
        transferSection.classList.add('hidden');
        toggleBtn.textContent = 'Gift NFT';
    } else {
        sellSection.classList.add('hidden');
        transferSection.classList.remove('hidden');
        toggleBtn.textContent = 'Sell NFT';
    }
}

// List token for sale
async function listToken(tokenId) {
    const priceInput = document.getElementById(`price-input-${tokenId}`);
    const priceStr = priceInput.value.trim();

    if (!priceStr) {
        alert('Please enter a listing price');
        return;
    }

    try {
        showTxStatus('Listing...');
        const price = Number.parseFloat(priceStr);
        const tx = await contract.listToken(tokenId, price);

        showTxStatus('Processing transaction...');
        await tx.wait();

        showTxStatus('Success! Token listed');
        priceInput.value = '';
        await loadTokens();

        setTimeout(hideTxStatus, 3000);
    } catch (error) {
        // console.error('Failed to list token:', error);
        showTxStatus('Failed to list token');
        setTimeout(hideTxStatus, 3000);
    }
}

// Transfer token
async function transferToken(tokenId) {
    const transferInput = document.getElementById(`transfer-input-${tokenId}`);
    const address = transferInput.value.trim();

    if (!address) {
        alert('Please enter a recipient address');
        return;
    }

    if (!ethers.utils.isAddress(address)) {
        alert('Invalid Ethereum address');
        return;
    }

    try {
        showTxStatus('Preparing transfer...');
        const tx = await contract.transfer(tokenId, address);

        showTxStatus('Processing transaction...');
        await tx.wait();

        showTxStatus('Success! Token transferred');
        transferInput.value = '';
        await loadTokens();

        setTimeout(hideTxStatus, 3000);
    } catch (error) {
        // console.error('Failed to transfer token:', error);
        const reason = parseError(error);
        showTxStatus(reason || 'Transfer failed');
        setTimeout(hideTxStatus, 3000);
    }
}

// Buy token
async function buyToken(tokenId) {
    try {
        showTxStatus('Preparing transaction...');
        let price = ethers.BigNumber.from(0);

        try {
            const listedPrice = await contract.listedPrice(tokenId);
            if (listedPrice.gt(0)) {
                price = listedPrice;
            } else {
                price = await contract.initialPrice();
            }
        } catch (error) {
            console.log('Error getting price:', error);
        }

        showTxStatus('Waiting for confirmation...');
        const tx = await contract.buyToken(tokenId, { value: price });

        showTxStatus('Processing transaction...');
        await tx.wait();

        showTxStatus('Success! NFT purchased');
        await loadTokens();

        setTimeout(hideTxStatus, 3000);
    } catch (error) {
        // console.error('Failed to buy token:', error);
        const reason = parseError(error);
        showTxStatus(reason || 'Transaction failed');
        setTimeout(hideTxStatus, 3000);
    }
}

// Parse error messages
function parseError(error) {
    if (error?.data?.message) {
        const msg = error.data.message;
        const match = msg.match(/reverted with reason string '(.*)'/);
        if (match) return match[1];
        return msg;
    }
    if (error?.reason) return error.reason;
    if (error?.message) return error.message;
    return null;
}

// Show transaction status
function showTxStatus(message) {
    txStatusText.textContent = message;
    txStatus.classList.add('show');
}

// Hide transaction status
function hideTxStatus() {
    txStatus.classList.remove('show');
}