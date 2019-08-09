//todo:
//add custom flags
//add help argument
//suffix mode

const Web3 = require('web3');
const rlp = require('rlp');
const keccak = require('keccak');
const secp256k1 = require('secp256k1');
const randomBytes = require('randombytes');
const chalk = require('chalk');

//defaults values
const userDefaults = {
    vanity: "dead",
    nonceDepth: 10,
    searchDepth: 1000000,
    showProgress: true,
    caseSensitive: true
}

//initialize env and get input
web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

//cli input
let userArgsRaw = process.argv.slice(2)

//process input
const validateInput = (inp) => {

    let u = userDefaults
    let count = userArgsRaw.length

    if (count === 0) {
        errorHandler(WELCOME)
    } else if (count > 5) {
        errorHandler(ERROR.NULL)
    }

    //naive wait to handle args, use flags instead
    if (count > 0) {
        let v = userArgsRaw[0].toString();
        if (v === "" || v === "-h") {
            errorHandler(WELCOME)
        } else {
            if (v[0] + v[1] === "0x") {
                v = v.slice(2)
                checkVanity(v)
            }
            u.vanity = v;
        }
    }

    if (count > 1) {
        let n = Number(userArgsRaw[1])
        if (n > 0 && n < 100 && typeof(n) === "number") {
            u.nonceDepth = n;
        }
    }

    if (count > 2) {
        s = Number(userArgsRaw[2])
        if (s > 1 && typeof(s) === "number") {
            u.searchDepth = s;
        }
    }

    if (count > 3) {
        a = Number(userArgsRaw[3])
        if (a === "n" || a === "no" || a === "false") {
            u.showProgress = false;
        }
    }

    if (count > 4) {
        y = userArgsRaw[4].toString()
        if (y === "n" || y === "no" || y === "false") {
            u.caseSensitive = false;
        }
    }

    mineVanity(u)
}

const checkVanity = (inp) => {
    if (inp === "" || inp === null || inp === undefined) {
        errorHandler(WELCOME)
    } else if (inp.length > 40) {
        errorHandler(ERROR.INVALID)
    } else {
        let valid = /[a-fA-F0-9]/g;
        let res = inp.match(valid);
        if (res.length === inp.length) {
            return
        } else {
            errorHandler(ERROR.INVALID)
        }
    }
}

//consolotate these methods
const replaceBlue = (inp) => {
    return chalk.blue(inp)
}

const replaceGreen = (inp) => {
    return chalk.green(inp)
}

const replaceCode = (inp) => {
    return chalk.bold(inp)
}

const resultHandler = (obj) => {
    let res = eval(obj)
    let json = JSON.stringify(res, null, 2)
    let color = json.replace(/[A-Za-z0-9:!]/g, replaceGreen)
    let code = color.replace(/`(.*?)`/g, replaceCode)
    let parse = code.replace(/[{}",`]/g, '')

    console.log(parse)
    process.exit(0)
}

const errorHandler = (obj) => {
    let res = eval(obj)
    let json = JSON.stringify(res, null, 2)
    let color = json.replace(/[A-Z]/g, replaceBlue)
    let code = color.replace(/`(.*?)`/g, replaceCode)
    let parse = code.replace(/[{}",`]/g, '')

    console.log(parse)
    process.exit(0)
}

//mining begins
const mineVanity = (inp) => {

    let vanity = inp.vanity;
    let mxNonce = inp.nonceDepth;
    let mxLoop = inp.searchDepth;
    let logOn = inp.showProgress;
    let caseOn = inp.caseSensitive;

    let addressFound = false;

    if (!caseOn) {
        vanity = vanity.toLowerCase()
    }

    for (let j = 0; j < mxLoop; j++) {

        for (let i = 0; i < mxNonce; i++) {

            let keyPair = getRandomWallet();
            let a = {
                addr: keyPair.address,
                priv: keyPair.privKey,
                nonce: web3.utils.toHex(i)
            }

            let input_arr = [a.addr, a.nonce];
            let rlp_encoded = rlp.encode(input_arr);
            let pubKey = keccak('keccak256')
                .update(rlp_encoded)
                .digest('hex');
            let cAddr = pubKey.substring(24);
            let length = vanity.length
            cAddr = Web3.utils.toChecksumAddress(cAddr)

            if (!caseOn) {
                cAddr = cAddr.toLowerCase()
            }

            if (logOn === true) {
                console.log(j, i, cAddr.slice(0, length + 2)
                    .concat("..."));
            }

            if (cAddr.slice(2, length + 2) === vanity) {
                let cSum = Web3.utils.toChecksumAddress(cAddr)
                let aSum = Web3.utils.toChecksumAddress(a.addr)
                resultHandler({
                    DEPTH: (j * mxNonce) + i,
                    GOAL: inp.vanity,
                    CONTRACT: cSum,
                    ADDRESS: aSum,
                    KEY: a.priv,
                    NONCE: i,
                    MSG: "vanity prefix found! make sure to deploy your contract at this nonce, from this address"
                });
                addressFound = true
                break
                return true
            }
        }

        if (addressFound === true) {
            break
        }
    }

    if (!addressFound) {
        errorHandler("ERROR.NULL");
    } else {
        process.exit(1)
    }
}

//address utils
const privateToAddress = (privateKey) => {
    const publicKey = secp256k1.publicKeyCreate(privateKey, false)
        .slice(1);
    return keccak('keccak256')
        .update(publicKey)
        .digest()
        .slice(-20)
        .toString('hex');
};

const getRandomWallet = () => {
    const randbytes = randomBytes(32);
    return {
        address: ("0x" + privateToAddress(randbytes)
            .toString('hex')),
        privKey: randbytes.toString('hex')
    };
};

//messages
const WELCOME = {
    ABOUT: "mine a key that will produce a vanity contract prefix if deployed at a specific nonce",
    VANITY: "0xad13... at nonce 4 will create a contract beginning with 0xbeef...",
    START: "try an example like: `node vain 12` or `node vain 0xbabe`",
    ARGS: "required: [vanity_prefix] optional: [max_nonce] [search_depth] [show_log] [case_sensitive]",
    TRY: "`node vain 0xdad 10 1000000 y n`"
}

const ERROR = {
    INVALID: "invalid input. check type, length, and number of args",
    NULL: "no valid address found. try a larger search area"
}

validateInput(userArgsRaw)