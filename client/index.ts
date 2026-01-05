import { 
    createSolanaRpc, 
    address, 
    pipe,
    createTransactionMessage,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    appendTransactionMessageInstruction,
    createKeyPairSignerFromBytes,
    generateKeyPairSigner,
    getSignatureFromTransaction,
    compileTransaction,
    getBase64EncodedWireTransaction,
} from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

const KEYPAIR_PATH = '/home/muk/.config/solana/id.json';

async function getOrCreateKeypair() {
    if (fs.existsSync(KEYPAIR_PATH)) {
        const keypairData = JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf-8'));
        const secretKey = new Uint8Array(keypairData);
        return await createKeyPairSignerFromBytes(secretKey);
    }
    
    const keypair = await generateKeyPairSigner();
    const secretKeyBytes = new Uint8Array(
        await crypto.subtle.exportKey('raw', (keypair as any).privateKey)
    );
    
    fs.writeFileSync(
        KEYPAIR_PATH, 
        JSON.stringify(Array.from(secretKeyBytes)),
        'utf-8'
    );
    
    return keypair;
}

async function main() {
    const rpc = createSolanaRpc('https://api.devnet.solana.com');
    const payer = await getOrCreateKeypair();
    const programId = address("Xx7cEWNkXWJWjRNNwXZZxicQpL2abzwhWHroXD64fSE");

    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
    const instructionData = new Uint8Array([]);
    
    const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (m) => setTransactionMessageFeePayer(payer.address, m),
        (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
        (m) => appendTransactionMessageInstruction({
            programAddress: programId,
            accounts: [
                { address: programId, role: 0 /* Read-only */ },
            ],
            data: instructionData,
        }, m)
    );

    // Sign and send the transaction
    const compiledTransaction = compileTransaction(transactionMessage);
    const signedTransaction = await payer.signTransaction(compiledTransaction);
    const base64Transaction = getBase64EncodedWireTransaction(signedTransaction);
    
    const signature = await rpc.sendTransaction(base64Transaction, { 
        encoding: 'base64',
        skipPreflight: false 
    }).send();
    
    console.log("✅ Transaction sent!");
    console.log("📝 Signature:", signature);
    console.log("🔍 View on explorer: https://explorer.solana.com/tx/" + signature + "?cluster=devnet");
}

main().catch(console.error);