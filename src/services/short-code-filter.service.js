const crypto = require("crypto");
const env = require("../config/env");
const logger = require("../config/logger");

let bitset = null;
let initialized = false;

function getBloomConfig() {
    return {
        enabled: env.urlFilter.enabled,
        bits: Math.max(1024, env.urlFilter.bloomBits),
        hashes: Math.max(2, env.urlFilter.bloomHashes)
    };
}

function getBitPosition(shortCode, seed, bits) {
    const digest = crypto
        .createHash("sha256")
        .update(`${seed}:${shortCode}`)
        .digest();

    return digest.readUInt32BE(0) % bits;
}

function setBit(position) {
    const byteIndex = Math.floor(position / 8);
    const bitOffset = position % 8;
    bitset[byteIndex] |= 1 << bitOffset;
}

function hasBit(position) {
    const byteIndex = Math.floor(position / 8);
    const bitOffset = position % 8;
    return (bitset[byteIndex] & (1 << bitOffset)) !== 0;
}

function addShortCode(shortCode) {
    if (!bitset || !shortCode) {
        return;
    }

    const normalized = shortCode.trim();
    if (!normalized) {
        return;
    }

    const { hashes, bits } = getBloomConfig();

    for (let seed = 0; seed < hashes; seed += 1) {
        setBit(getBitPosition(normalized, seed, bits));
    }
}

function mightContainShortCode(shortCode) {
    if (!shortCode || typeof shortCode !== "string") {
        return true;
    }

    const config = getBloomConfig();

    if (!config.enabled || !initialized || !bitset) {
        return true;
    }

    const normalized = shortCode.trim();

    if (!normalized) {
        return true;
    }

    for (let seed = 0; seed < config.hashes; seed += 1) {
        if (!hasBit(getBitPosition(normalized, seed, config.bits))) {
            return false;
        }
    }

    return true;
}

function initializeShortCodeFilter(shortCodes = []) {
    const config = getBloomConfig();

    if (!config.enabled) {
        initialized = true;
        logger.info("Short-code Bloom filter disabled");
        return;
    }

    bitset = new Uint8Array(Math.ceil(config.bits / 8));

    for (const shortCode of shortCodes) {
        addShortCode(shortCode);
    }

    initialized = true;
    logger.info(
        {
            codeCount: shortCodes.length,
            bloomBits: config.bits,
            bloomHashes: config.hashes
        },
        "Short-code Bloom filter initialized"
    );
}

function isShortCodeFilterReady() {
    return initialized;
}

module.exports = {
    initializeShortCodeFilter,
    isShortCodeFilterReady,
    mightContainShortCode,
    addShortCode
};