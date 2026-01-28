import './Token.css'
import { ethers } from "ethers";
import { useState } from "react";

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

    const listToken = async (id: number) => {
        if (!contract) return;
        const priceStr = listingPrices[id];
        if (!priceStr) return alert("Please enter a listing price");

        try {
            setLoading(true);
            setTxStatus("Listing ..");
            const price = ethers.parseEther(priceStr);
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
            setTxStatus("Transaction failed");
            setTimeout(() => setTxStatus(""), 3000);
        } finally {
            setLoading(false);
        }
    };

    return <div key={id} className="nft-card" style={{ animationDelay: `${index * 0.1}s` }}>
        <div className="nft-image-container">
            <div className="nft-image-placeholder">
                <span className="nft-id">#{id}</span>
                <div className="cat-emoji">😸</div>
            </div>
            {price && (
                <div className="price-badge">
                    <span className="eth-symbol">Ξ</span>
                    {price}
                </div>
            )}
        </div>

        <div className="nft-details">
            <div className="nft-header">
                <h3 className="nft-title">Napping Cat #{id}</h3>
                <div className="nft-uri">{uri.slice(0, 20)}...</div>
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
                        <span className="btn-icon">🛒</span>
                        Buy Now
                        {price && (
                            <span className="btn-price">Ξ {price}</span>
                        )}
                    </button>
                ) : (
                    <div className="sell-section">
                        <div className="input-group">
                            <span className="input-prefix">Ξ</span>
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
                            <span className="btn-icon">💰</span>
                            List for Sale
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
}