const express = require("express");
const { getContractInfo } = require("../controllers/rahelmeleseApitestController");

const router = express.Router();

// GET /api/rahelmeleseapitest/contract-info?address=0x...&rpcUrl=https://...
router.route("/contract-info").get(getContractInfo);

module.exports = router;
