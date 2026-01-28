import './Token.css'
import { ethers } from "ethers";
import { useEffect, useState } from "react";

import data0 from '../assets/0.json';
import data1 from '../assets/1.json';
import data2 from '../assets/2.json';


export interface CatToken {
    id: number;
    uri: string;
    owner: string;
    price?: string;
}

type TokenProps = CatToken & {
    index: number;
    contract: ethers.Contract | null;
    account: String
    signer: ethers.Signer | null;
    loadTokens: (c: ethers.Contract) => Promise<void>;
    setTxStatus: (v: string) => void;
};

type TokenData = {
    token_name: string
    description: string
    token_image_uri: string
}

export default function Token({
    id,
    uri,
    owner,
    price,
    index,
    contract,
    account,
    signer,
    loadTokens,
    setTxStatus,
}: TokenProps) {

    const [listingPrices, setListingPrices] = useState<{ [id: number]: string }>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [tokenData, setTokenData] = useState<TokenData>();
    const [showTransfer, setShowTransfer] = useState<boolean>(false);
    const [transferAddress, setTransferAddress] = useState<string>("");

    useEffect(() => {
        if (uri === '0.json') {
            setTokenData(data0);
        } else if (uri === '1.json') {
            setTokenData(data1);
        } else if (uri === '2.json') {
            setTokenData(data2);
        } else {
            console.warn("NFTs data not found");
            setTokenData(undefined);
        }
    }, [uri]);

    const listToken = async (id: number) => {
        if (!contract) return;
        const priceStr = listingPrices[id];
        if (!priceStr) return alert("Please enter a listing price");

        try {
            setLoading(true);
            setTxStatus("Listing ..");
            const price = Number.parseFloat(priceStr);
            const tx = await contract.listToken(id, price);
            setTxStatus("Processing transaction...");
            await tx.wait();
            setTxStatus("Success! Token listed");
            await loadTokens(contract);
            setListingPrices({ ...listingPrices, [id]: "" });
            setTimeout(() => setTxStatus(""), 3000);
        } catch (error) {
            setTxStatus("Failed to list token");
            setTimeout(() => setTxStatus(""), 3000);
        } finally {
            setLoading(false);
        }
    };

    const transferToken = async (id: number) => {
        if (!contract) return;
        if (!transferAddress) return alert("Please enter a recipient address");

        // Validate Ethereum address
        if (!ethers.isAddress(transferAddress)) {
            return alert("Invalid Ethereum address");
        }

        try {
            setLoading(true);
            setTxStatus("Preparing transfer...");
            const tx = await contract.transfer(id, transferAddress);
            setTxStatus("Processing transaction...");
            await tx.wait();
            setTxStatus("Success! Token transferred");
            await loadTokens(contract);
            setTransferAddress("");
            setShowTransfer(false);
            setTimeout(() => setTxStatus(""), 3000);
        } catch (error) {
            const reason = parseEthersError(error);
            if (reason === "Not token owner") {
                setTxStatus("You don't own this token");
            } else if (reason === "Invalid address") {
                setTxStatus("Invalid recipient address");
            } else {
                setTxStatus("Transfer failed");
            }
            setTimeout(() => setTxStatus(""), 3000);
        } finally {
            setLoading(false);
        }
    };

    const buyToken = async (id: number) => {
        if (!contract || !signer) return;
        try {
            setLoading(true);
            setTxStatus("Preparing transaction...");
            let price = 0n;
            try {
                const listedPrice = await contract.listedPrice(id);
                if (listedPrice > 0n) price = listedPrice;
                else price = await contract.initialPrice();
            } catch { }

            setTxStatus("Waiting for confirmation...");
            const tx = await contract.buyToken(id, { value: price });
            setTxStatus("Processing transaction...");
            await tx.wait();
            setTxStatus("Success! NFT purchased");
            await loadTokens(contract);
            setTimeout(() => setTxStatus(""), 3000);
        } catch (error) {
            const reason = parseEthersError(error);
            if (reason === "Token not for sale") {
                setTxStatus("Token not for sale");
            } else {
                setTxStatus("Transaction failed");
            }
            setTimeout(() => setTxStatus(""), 3000);
        } finally {
            setLoading(false);
        }
    };

    function parseEthersError(error: any): string | null {
        // Most of the time the revert reason is here:
        if (error?.data?.message) {
            const msg = error.data.message;
            const match = msg.match(/reverted with reason string '(.*)'/);
            if (match) return match[1];
            return msg;
        }

        // Sometimes Ethers includes reason directly
        if (error?.reason) return error.reason;

        return null;
    }


    return <div key={id} className="nft-card" style={{ animationDelay: `${index * 0.1}s` }}>
        <div className="nft-image-container">
            {tokenData?.token_image_uri != '' &&
                < img
                    src={tokenData?.token_image_uri}
                    alt={`NFT #${id}`}
                    className="nft-image"
                />
            }
            <div className="nft-image-placeholder">
                <span className="nft-id">#{index}</span>
            </div>
            {price && (
                <div className="price-badge">
                    {ethers.parseEther(price)}
                </div>
            )}
        </div>

        <div className="nft-details">
            <div className="nft-header">
                <h3 className="nft-title">Napping Cat #{id}</h3>
                <div className="nft-uri">{tokenData?.token_name}</div>
            </div>

            <div className="nft-owner">
                <span className="owner-label">Owner</span>
                <span className="owner-address">
                    {`${owner.slice(0, 6)}...${owner.slice(-4)}`}
                </span>
            </div>

            <div className="nft-actions">
                {owner.toLowerCase() !== account?.toLowerCase() ? (
                    <button
                        onClick={() => buyToken(id)}
                        className="action-btn buy-btn"
                        disabled={loading}
                    >
                        Buy Now
                        {price && (
                            <div className="btn-price">
                                {ethers.parseEther(price)}
                            </div>
                        )}
                    </button>
                ) : (
                    <div className="owner-actions">
                        {/* Sell Section */}
                        {!showTransfer && (
                            <div className="sell-section">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="0.00"
                                        value={listingPrices[id] || ""}
                                        onChange={(e) =>
                                            setListingPrices({
                                                ...listingPrices,
                                                [id]: e.target.value
                                            })
                                        }
                                        className="price-input"
                                    />
                                </div>
                                <button
                                    onClick={() => listToken(id)}
                                    className="action-btn sell-btn"
                                    disabled={loading}
                                >
                                    List for Sale
                                </button>
                            </div>
                        )}

                        {/* Transfer Section */}
                        {showTransfer && (
                            <div className="transfer-section">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="0x..."
                                        value={transferAddress}
                                        onChange={(e) => setTransferAddress(e.target.value)}
                                        className="transfer-input"
                                    />
                                </div>
                                <button
                                    onClick={() => transferToken(id)}
                                    className="action-btn transfer-btn"
                                    disabled={loading}
                                >
                                    Send NFT
                                </button>
                            </div>
                        )}

                        {/* Toggle Button */}
                        <button
                            onClick={() => setShowTransfer(!showTransfer)}
                            className="toggle-btn"
                            disabled={loading}
                        >
                            {showTransfer ? "← Back to Sell" : "Gift NFT"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
}