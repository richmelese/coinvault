const { ethers } = require("ethers");
const asyncErrorHandler = require("../middlewares/helpers/asyncErrorHandler");
const ErrorHandler = require("../utils/errorHandler");

const DEFAULT_RPC_URL =
  process.env.RPC_URL || "https://ethereum-rpc.publicnode.com";

const DEFAULT_CONTRACT_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

// Minimal ERC20 ABI, enough to read basic token info from most contracts.
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
];

// Best-effort read: some contracts aren't ERC20s, so individual calls may fail.
const tryRead = async (fn) => {
  try {
    return await fn();
  } catch (err) {
    return null;
  }
};

// Rahel Melese - API test: fetch live info about a smart contract from the blockchain.
exports.getContractInfo = asyncErrorHandler(async (req, res, next) => {
  const address = req.query.address || DEFAULT_CONTRACT_ADDRESS;
  const rpcUrl = req.query.rpcUrl || DEFAULT_RPC_URL;

  if (!ethers.isAddress(address)) {
    return next(new ErrorHandler(`Invalid contract address: ${address}`, 400));
  }

  const fetchRequest = new ethers.FetchRequest(rpcUrl);
  fetchRequest.timeout = 10000;
  const provider = new ethers.JsonRpcProvider(fetchRequest);

  const code = await provider.getCode(address);
  if (code === "0x") {
    return next(
      new ErrorHandler(`No contract found at address ${address}`, 404)
    );
  }

  const [network, blockNumber, balanceWei] = await Promise.all([
    provider.getNetwork(),
    provider.getBlockNumber(),
    provider.getBalance(address),
  ]);

  const contract = new ethers.Contract(address, ERC20_ABI, provider);

  const [name, symbol, decimals, totalSupplyRaw] = await Promise.all([
    tryRead(() => contract.name()),
    tryRead(() => contract.symbol()),
    tryRead(() => contract.decimals()),
    tryRead(() => contract.totalSupply()),
  ]);

  const result = {
    address,
    network: {
      name: network.name,
      chainId: network.chainId.toString(),
    },
    blockNumber,
    nativeBalance: ethers.formatEther(balanceWei),
    isContract: true,
    token: {
      name,
      symbol,
      decimals: decimals !== null ? Number(decimals) : null,
      totalSupply:
        totalSupplyRaw !== null && decimals !== null
          ? ethers.formatUnits(totalSupplyRaw, decimals)
          : totalSupplyRaw !== null
          ? totalSupplyRaw.toString()
          : null,
    },
    fetchedAt: new Date().toISOString(),
  };

  // Task requirement: show the fetched smart contract info on the console.
  console.log("RahelmeleseApitest - Smart Contract Info:", result);

  res.status(200).json({
    success: true,
    ...result,
  });
});
