function hash(psw) {
    let ha = "";

    for (let i = 0; i < psw.length; i++) {
        let current = psw.charCodeAt(i);
        let next = psw.charCodeAt(psw.length - 1 - i);
         
        ha += (i & psw.length) + (current & next);
        ha ^= ha << 23;
        ha ^= ha >>> 45;
        ha ^= ha << 57;
        ha >>>= 0;
        ha >>>= 0;
    }
    return ha.toString(29);
}
module.exports = hash;