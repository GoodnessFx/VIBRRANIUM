import { ethers } from "ethers";

export class BlockchainService {
  private provider: ethers.WebSocketProvider | ethers.JsonRpcProvider;
  private primaryRpcUrl: string;
  private fallbackRpcUrl: string;
  private isWebSocket: boolean;
  private reconnectAttempts: number = 0;
  private maxReconnectDelay: number = 30000;

  constructor(primaryRpcUrl: string, fallbackRpcUrl: string = "", isWebSocket: boolean = false) {
    this.primaryRpcUrl = primaryRpcUrl;
    this.fallbackRpcUrl = fallbackRpcUrl;
    this.isWebSocket = isWebSocket;
    this.provider = this.connect();
  }

  private connect(): ethers.WebSocketProvider | ethers.JsonRpcProvider {
    if (this.isWebSocket) {
      const wsProvider = new ethers.WebSocketProvider(this.primaryRpcUrl);
      
      wsProvider.on("error", (error) => {
        console.error(`WebSocket error for ${this.primaryRpcUrl}:`, error);
        this.handleReconnect();
      });

      // ethers v6 doesn't have a direct 'close' event on WebSocketProvider like v5
      // but we can monitor the underlying websocket if needed.
      // For now, we'll rely on the error handler and a heartbeat if necessary.
      
      return wsProvider;
    }
    return new ethers.JsonRpcProvider(this.primaryRpcUrl);
  }

  private async handleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, this.maxReconnectDelay);
    
    console.log(JSON.stringify({
      event: "reconnect_attempt",
      attempt: this.reconnectAttempts,
      delayMs: delay,
      timestamp: new Date().toISOString()
    }));

    setTimeout(() => {
      this.provider = this.connect();
    }, delay);
  }

  async getTransaction(txHash: string) {
    try {
      return await this.provider.getTransaction(txHash);
    } catch (error) {
      if (this.fallbackRpcUrl) {
        console.warn(`Primary RPC failed, failing over to QuickNode: ${this.fallbackRpcUrl}`);
        const fallbackProvider = new ethers.JsonRpcProvider(this.fallbackRpcUrl);
        return await fallbackProvider.getTransaction(txHash);
      }
      throw error;
    }
  }

  async pauseContract(contractAddress: string, abi: any, privateKey: string, reason: string) {
    const wallet = new ethers.Wallet(privateKey, this.provider);
    const contract = new ethers.Contract(contractAddress, abi, wallet);
    
    const attempts = [1n, 2n, 3n]; // 1x, 2x, 3x gas multipliers
    
    for (let i = 0; i < attempts.length; i++) {
      try {
        const feeData = await this.provider.getFeeData();
        const gasPrice = feeData.gasPrice;
        
        if (!gasPrice) throw new Error("Could not fetch gas price.");

        const multiplier = attempts[i];
        console.log(`Pause attempt ${i + 1} with ${multiplier}x gas...`);
        
        const tx = await contract.pause({ 
          gasPrice: gasPrice * multiplier 
        });
        return await tx.wait();
      } catch (error) {
        console.warn(`Pause attempt ${i + 1} failed for ${contractAddress}:`, error);
        if (i === attempts.length - 1) {
          console.error(`All 3 pause attempts failed for ${contractAddress}. MANUAL ACTION REQUIRED.`);
          throw new Error("Pause transaction failed after 3 retries");
        }
      }
    }
    throw new Error("Unreachable code in pauseContract");
  }

  onPendingTransaction(callback: (tx: ethers.TransactionResponse) => void) {
    if (this.provider instanceof ethers.WebSocketProvider) {
      this.provider.on("pending", async (txHash: string) => {
        try {
          const tx = await this.getTransaction(txHash);
          if (tx) callback(tx);
        } catch (error) {
          // Silent fail for failed tx fetches
        }
      });
    }
  }
}
