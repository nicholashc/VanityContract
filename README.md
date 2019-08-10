# Vanity Addresses for Contracts!

A simple node (but pretty much vanilla js) script that finds vanity contract addresses by generating *x* key-pairs and checking each of their first *y* nonces until the desired result is found. This is an extention of a script I originally wrote as part of the [Delfi](http://github.com/nicholashc/Delfi) project at EthDenver 2019.

### About 

Ethereum contracts made with the `create` opcode are deterministic (`create2` too, but let's leave that aside for now). They take an rlp encoded array of the deploying address and its current nonce, hash it into a public key, and extract the last 20 bytes to determine the address of the new contract.

### Install and Run

`git clone https://github.com/nicholashc/VanityContract.git`

`cd` into the directory.

`node vain` returns a welcome message.

`node vain 0xbabe` begins a search for an address/nonce that will create a contract prefixed with 0xbabe... Note: prepending 0x is optional and will produce the same result if included/excluded. By default, this command style will search the first 10 nonces of 1,000,000 potential new prandom key-pairs (ie, loop through 10 nonces of address 0, then 10 nonces of address 1, etc). By default, it will display in-progress results in the console and is case-sensitive to address checksums.

`node vain beefbeef 5 10000000 n n` begins search with customized settings (details in [Parameters](#Parameters).

### Dependancies

This odd-ball basket of dependancies is mostly vestigial from the quick-and-dirty hackathon origins of this script. They likely can and will be replaced/consolidated entirely with `ethereumjs-util` or similar. They are used in the following ways:

`web3`: Checking address validity and performing checksum conversions
`rlp`: Rlp encoding in a way that plays nice with Ethereum formats
`keccak`: Reliable hashing because "keccak" is hard to pin down (eg, versions of web3js `Sha3` vs web3js `Solidity.Sh3` vs `keccak` or `keccak256` or `sha3` functions elsewhere all give different results)
`secp256k1`: Convert a private key to a public key
`randombytes`: Generate a pseudo-random seed for a valid ethereum private key (**note: not validated for secure randomness***). Feel free to replace this with any other prandom/random source that spits out 32 bytes of hex
`chalk`: Pretty(-ish) printing in the console. This is purely an aesthetic dependancy and can be removed/customized without affecting functionality

### Parameters

There are reasonable defaults set to return results in "normal" searches for a ~1-8 char vanity prefixes. Certain hard limits enforce reasonable ranges for all inputs. Of course, you can override any of this by directly changing/removing limits in the `vain.js` file.

###### Required

0) `vanity`
- Hex prefix you want your contract to have
- Valid input: unbroken sequence of 1-40 characters from a set inclduing: A-F, a-f, 0-9
- Default: none, a user input is required to start search
- Notes: prepending 0x is optional (eg, `0xdead` and `dead` are equivalent inputs). If 0x is included it is not counted in the length of the input. While, you *could* try searching for a 40 character vanity (eg, a full ethereum address) most personal computers will struggle to promptly return results with any inputs longer than 6-8 characters

###### Optional

While the following values are optional, for now you need pass the full set of arguments in the correct order (eg, all or nothing). For example: `node vain 0xFADED 2 50000000 n y` is valid because it has all the required vanity and all four optional arguments in the expected order. `node vain beef 5 n` is invalid and will likely fail with an error. Smarter, non-linear, independent flags are a planned improvement. 

1) `nonceDepth`
- Number of nonces searched for every new address generated
- Valid input: integers between 1-100 
- Default: `10`
- Note: the vanity contract is only accessible from the specific address/nonce combo returned (though others technically exist with different address/nonce combos). If you pass that nonce there's no going back. With a high nonce range, you'll need to send a bunch of transactions to get to the right nonce before deployment.

2) `searchDepth`
- Number of new key pairs generated and tested before halting
- Valid input: any positive integer >0
- Default: `1000000`
- Note: this is mainly a mechanism to cap never-ending processes during testing or in the case of malformed inputs

3) `showProgress`
- Displays the most recent result, wether it matches the input, the current search depth, and the current nonce depth
- Valid input: `y` or `yes` to enable || `n` or `no` to disable
- Default: `y` 
- Note: this is useful for validating everything working with a short search for one or two character letter prefixes (and fun to watch). However, all these `console.log()` operations *really slow down* performance.

4) `caseSensitive`
- Capital hex letters in your input are considered and matched against checksummed addresses
- Valid input: `y` or `yes` to enable || `n` or `no` to disable
- Default: `y`
- Notes if disabled:
  - You can still input capital hex characters but they are treated as lowercase
  - Search is faster but disregards checksums (eg, in a search for `1DAD`: `0x1dad...`, `0x1daD...`, etc are all valid)  
- Notes if enabled: 
  - The set of possible characters for each index of the address string increases from 16 to 22
  - Search is slower but more precise (eg, `1DAD` only returns `0x1DAD...` as valid)

### Results

If/when a valid result is found. The following will be returned to your console and execution will halt.

`DEPTH`: The number of total searches (searchDepth reached * nonceDepth + current nonce in current searchDepth)
`GOAL`: The prefix target you gave as input
`CONTRACT`: The checksummed address of the contract, if deployed at the specific nonce/address combo
`ADDRESS`: The checksummed address required to deploy this contract
`KEY`: Private key for this address **note: in plain text!** 
`NONCE`: The magic nonce you must use to deploy your vanity contract
`MSG`: a reminder of the above
`WARNING`: a reminder to save the results somewhere secure as nothing is written by this script to a file. (Note: forms of this output may still leave traces in bash history logs, other programs that can access to your stdout, etc).

If the max searchDepth is reached before finding a valid result or if another error happens, a mildly-useful error message will be returned to your console. This readme is a better resource for troubleshooting.

### Troubleshooting

###### node and/or vain.js not found? 

Try declaring the absolute path to both node and the vain.js file eg: `/usr/local/bin/node  /your/custom/directory/vain.js` + `vanity` + optional parameters as described above.

###### No address found? 

The search space is the `nonceDepth` * `searchDepth`, increase either or both. Or search for a shorter prefix.

###### node/dependancy issues? 

Try downgrading to 10.x with nvm or your preferred version manager and install dependancies again.

###### Performance Issues? 

Try turning off `showProgress` to stop the `console.log()`'s clogging things up thousands of times a second. Also, make sure any previous `vain` processes aren't still chugging away in the background (shouldn't happen, but is possible). Kill those processes if they exit.

###### Taking too long? 

Even low spec consumer machines should be able to find valid 4 character prefixes relatively quickly (on the order of 1-2 minutes). This is basically "mining" so each added character increases the difficulty level by at least an order of magnitude. The possible number of permutations to search through is something like `16!/(16−prefix.length)!` or with caseSensitivity on `22!/(22−prefix.length)!`. However, you are techniclaly searching truncated versions of the much larger set of possible ethereum addresses (themselves a from larger set of possible public keys). I'm fuzzy on exactly how permutations/probability/birthday-paradox applies when nested like this so will say simply: for each input.length += 1, the search takes waa...aay longer to find a result. Start with a single character and increment up to gauge results in your environment.

###### Still taking too long?

Making node/javascript do synchronous cpu intensive work is pretty inefficient (and probably dumb in general). Someone else has likely written a similar program with parallelization, gpu/asic integration, or in a language better suited to hashing and evaluating huge data sets.

### Future Updates

- refactor to eliminate redundant methods, mixed js syntax styles, general sloppiness
- consolidate dependancies to use `ethereumjs-util` or some other package with all required functionality
- add option for vanity suffixes and both prefixes + suffixes
- add flags that enable independent toggling of defaults
- increase security of pk generation/display
- support for `create2` addresses (accept address, nonce, and initcode as arguements, and incrmenet salt during search?) 
- front end interface

### Disclaimer 

I make no guarantees about the security or randomness of the key-pairs generated. The source of randomness relies on the `randombytes` npm module, which I have made no effort to audit/validate. The private key are displayed on your console in plain text, likely logged in your bash history, and possibly read/logged by other applications that can access to stdout or log history. I strongly discourage using the key-pair generated for anything other than deploying the desired vanity contract. I discouage sending any more value than the  gas cost to deploy the contract to those addresses. Give exclusive access control of the contract to another address you trust was generated with greater security before any transferring significant value to and/or enabling powerful permissions in the contract.

### License 

This software is licensed under the *yolo* licence: use, modify, distribute, etc freely without restriction. Do whatever you want. However, I make no guarantees and accept no responsibility for anything, including: performance, results, security, answering questions prompty or at all, implementing any of the [future updates](#Future Updates), etc.

Note: the *yolo* license is also licensed under the *yolo* license.

### Thanks

General inspiration and some code snippets adapted from [vanity-eth](https://vanity-eth.tk/)
