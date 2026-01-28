import './App.css'
import Token, { type CatToken } from './componant/Token';
import { useState } from "react";
import { ethers } from "ethers";
import contractData from "./napping_cats_contract.json";

const CONTRACT_ADDRESS = contractData.address;
const CONTRACT_ABI = contractData.abi;

export default function App() {
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string>("");
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [tokens, setTokens] = useState<CatToken[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<string>("");

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        setLoading(true);
        await (window as any).ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: '0x7a69' }] });
        const prov = new ethers.BrowserProvider((window as any).ethereum);
        await prov.send("eth_requestAccounts", []);
        const signer = await prov.getSigner();
        const addr = await signer.getAddress();
        setSigner(signer);
        setAccount(addr);
        const c = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        setContract(c);
        await loadTokens(c);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        alert("Failed to connect wallet");
      }
    } else {
      alert("Please install MetaMask to use this dApp");
    }
  };

  const loadTokens = async (c: ethers.Contract) => {
    const loaded: CatToken[] = [];
    for (let id = 0; id < 3; id++) {
      try {
        const uri: any = await c.tokenURI(id);
        const owner: any = await c.ownerOf(id);
        let price: string | undefined = undefined;
        try {
          const listedPrice = await c.listedPrice(id);
          if (listedPrice > 0n) price = ethers.formatEther(listedPrice);
        } catch { }
        loaded.push({ id, uri, owner, price });
      } catch (error) {
        console.error(`Failed to load token ${id}:`, error);
      }
    }
    setTokens(loaded);
  };

  return (
    <div className="app-container">
      {/* Animated Background */}
      <div className="bg-gradient"></div>
      <div className="bg-grid"></div>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">😺</div>
            <h1 className="logo-text">Napping Cats</h1>
          </div>

          {!account ? (
            <button onClick={connectWallet} className="connect-btn" disabled={loading}>
              <span className="btn-icon">🔗</span>
              {loading ? "Connecting..." : "Connect Wallet"}
            </button>
          ) : (
            <div className="wallet-info">
              <div className="wallet-badge">
                <span className="status-dot"></span>
                <span className="wallet-address">{`${account.slice(0, 6)}...${account.slice(-4)}`}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Transaction Status */}
      {txStatus && (
        <div className="tx-status">
          <span className="tx-icon">⏳</span>
          {txStatus}
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        {!account ? (
          <div className="welcome-section">
            <h2 className="welcome-title">Welcome to Napping Cats NFT</h2>
            <p className="welcome-subtitle">Connect your wallet to explore and trade adorable sleeping felines</p>
            <div className="welcome-features">
              <div className="feature-card">
                <div className="feature-icon">🎨</div>
                <h3>Unique NFTs</h3>
                <p>Each cat is one-of-a-kind</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💎</div>
                <h3>Trade Freely</h3>
                <p>Buy and sell on the marketplace</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h3>Secure & Decentralized</h3>
                <p>Powered by Ethereum</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="marketplace-section">
            <div className="section-header">
              <h2 className="section-title">Marketplace</h2>
              <p className="section-subtitle">Discover and collect napping cats</p>
            </div>

            <div className="nft-grid">
              {tokens.map((token, index) => (
                <Token
                  key={token.id}
                  {...token}
                  index={index}
                  contract={contract}
                  account={account}
                  signer={signer}
                  loadTokens={loadTokens}
                  setTxStatus={setTxStatus}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>Built with ❤️ on Ethereum</p>
      </footer>
    </div>
  );
}
