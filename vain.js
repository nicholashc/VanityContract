const Web3 = require('web3');
const rlp = require('rlp');
const keccak = require('keccak');
const secp256k1 = require('secp256k1');
const randomBytes = require('randombytes');
const chalk = require('chalk');

//defaults values
const userDefaults = {
    vanity: "",
    nonceDepth: 10,
    searchDepth: 1000000,
    logOn: true,
    caseOn: true
}

//initialize env and get input
//note: web connection not actually needed just the utils
web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

//parse user cli input
let userArgsRaw = process.argv.slice(2)

//process input
const validateInput = (inp) => {
    //create user object initialized with defaults
    let u = userDefaults
    let count = userArgsRaw.length
    
    //hacky way to deal with argument parsing
    if (count === 0) {
        //fallback on default message
        errorHandler(WELCOME)
    } else if (count > 5) {
        errorHandler(ERROR.NULL)
    } 


    let v = userArgsRaw[0].toString();
    if (v === "" || v === null || v === undefined) {
        errorHandler(WELCOME)
    } else {
        //remove 0x if included
        if (v[0] + v[1] === "0x") {
            v = v.slice(2)
            //check validity of input
            checkVanity(v)
        }
        //update user object once validated
        u.vanity = v;
    }

    if (count > 1) {
        //naive way to check validity of additional arguments 
        //relies on correct sequencing of arguments
        //these methods all do a type conversion, check validity, and update if valid
        //invalid inputs fallback on the default and do not throw an error
    
        let n = Number(userArgsRaw[1])
        if (n > 0 && n < 100) {
            u.nonceDepth = n;
        }
    

        if (count > 2) {
            s = Number(userArgsRaw[2])
            if (s > 1) {
                u.searchDepth = s;
            }
        }

        if (count > 3) {
            a = userArgsRaw[3].toString()
            if (a === "n" || a === "no" || a === "false") {
                u.logOn = false;
            }
        }

        if (count > 4) {
            y = userArgsRaw[4].toString()
            if (y === "n" || y === "no" || y === "false") {
                u.caseOn = false;
            }
        }
    }
    //begin search
    mineVanity(u)
}

//all cases result in an error message if invalid or a return if valid
const checkVanity = (inp) => {
    if (inp.length > 40) {
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


//methods to style output
//should be consolidated into one general method
const replaceBlue = (inp) => {
    return chalk.blue(inp)
}

const replaceGreen = (inp) => {
    return chalk.green(inp)
}

const replaceCode = (inp) => {
    return chalk.bold(inp)
}

//methods to handle and style results/errors then end execution
//should be consolidated into one general method
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
    process.exit(1)
}

//main search logic
const mineVanity = (inp) => {
    
    //handle local instance of target 
    let vanity = inp.vanity;

    if (!inp.caseOn) {
        //treat all input as lowercase
        vanity = vanity.toLowerCase()
    }

    //calc this only once
    let length = vanity.length;
    
    //flag for successful completion
    let addressFound = false;
        
    //outer loop that increments 1 every searchDepth
    for (let j = 0; j < inp.searchDepth; j++) {

        //generate a new key-pair in each loop
        let a = getRandomWallet();
        
        //inner loop that runs to nonceDepth for each key-pair in j
        for (let i = 0; i < inp.nonceDepth; i++) {
            //note: current nonce is always i

            //calculate the contract address created by this address/nonce
            let rlp_encoded = rlp.encode([a.addr, i]);
            let cAddr = keccak('keccak256')
                .update(rlp_encoded)
                .digest()
                .slice(-20)
                .toString('hex')
            
            //add checksum if flagged, remove 0x
            if (inp.caseOn) {
                cAddr = Web3.utils.toChecksumAddress(cAddr).slice(2)
            }
        
            //display running log of results if default is on
            if (inp.logOn) {
                console.log(j, i, "0x"+cAddr.slice(0, length)+"...");
            }
            
            //compare slice of result with target
            if (cAddr.slice(0, length) === vanity) {

                //feed findings to the resultHandler method for formating
                resultHandler({
                    DEPTH: (j * inp.nonceDepth) + i,
                    GOAL: vanity,
                    CONTRACT: Web3.utils.toChecksumAddress(cAddr),
                    ADDRESS: Web3.utils.toChecksumAddress(a.addr),
                    PRIVKEY: a.priv,
                    NONCE: i,
                    FOUND: "success! save this result and use to deploy your vanity contract"
                });
                
                //set flag and break out of inner loop
                addressFound = true
                break
            }
        }
        //break out of outer look
        if (addressFound === true) {
            break
        }
    }
    //handle situation where loops complete without finding a result
    if (!addressFound) {
        errorHandler("ERROR.NULL");
    } else {
        process.exit(0)
    }
}

//key pair utils
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
        addr: ("0x" + privateToAddress(randbytes)),
        priv: randbytes.toString('hex')
    };
};

//messages
const WELCOME = {
    ABOUT: "mine a key/nonce that will produce a vanity contract prefix",
    EG: "0xad13... at nonce 4 will create a contract with 0xbeef...",
    START: "try an example like: `node vain aa` or `node vain 0xbabe`",
    ARGS: "required: [vanity] optional: [nonceDepth] [searchDepth] [showLog] [caseOn]",
    EXAMPLE: "`node vain 0xdad 10 1000000 y n`"
}

const ERROR = {
    INVALID: "invalid input. check type, length, and number of args",
    NULL: "no valid address found. try a larger search area"
}

//trigger to start based on console input
validateInput(userArgsRaw)