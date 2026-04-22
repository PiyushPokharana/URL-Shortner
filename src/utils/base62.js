const BASE62_CHARSET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encodeBase62(value) {
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error("Base62 value must be a positive integer");
    }

    let num = value;
    let encoded = "";

    while (num > 0) {
        const remainder = num % 62;
        encoded = BASE62_CHARSET[remainder] + encoded;
        num = Math.floor(num / 62);
    }

    return encoded;
}

module.exports = {
    encodeBase62
};