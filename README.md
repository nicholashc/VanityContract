# VanityContractAddresses

A simple node (but basically vanilla js) script that creates vanity contract addresses by generating *x* key-pairs and checking their first *y* nonces until the desired result is found. This is an adaption of script I originally wrote as part of the [Delfi](http://github.com/nicholashc/Delfi) project at EthDenver 2019.

### About 

Ethereum contracts made with the `create` opcode are deterministic. They take an rlp encoded array of the deploying address and nonce, hash it into a public key, and extract the last 24 bytes to determine the address of the new contract.

### Install and Run

`git clone https://github.com/nicholashc/VanityContractAddresses.git`

`cd` into the directory

`node vain` returns a welcome message.

`node vain 0xbabe` begins search for an address and nonce combination that will a matching contract starting with 0xbabe... Note that adding 0x is optional and will produce the same result if excluded. By default this will search the first 10 nonces of 1,000,000 potential deploying addresses. By default it will display in-progress results and is case-sensitive to checksums.

`node vain beefbeef 5 10000000 n n` begins search with customized settings.

### Dependancies

This basket of dependancies are mostly vestigial from quick-and-dirty hackathon origins of this script. They can likely be replaced entirely with `ethereumjs-util`. They are used in the following ways:

`web3`: checking address validity and checksum conversions
`rlp`: rlp encoding in a way that plays nice with ethereum 
`keccak`: older versions of web3 produced inconsistent results between `Sha3`, `Solidity.Sh3`, and other libraries' keccak results
`secp256k1`: convert a private key to a public key
`randombytes`: generate a pseudo-random valid ethereum private key 
`chalk`: pretty printing in the console. can be removed if you don't care about that sort of thing

### Parameters

###### Required

0) `vanity`
- the hex character prefix you are searching for
- prepending 0x is optional (eg, `0xdead` and `dead` are equivalent inputs)
- valid input: unbroken sequence of 1-40 these characters: A-F, a-f, 0-9
- default: user input required to start search
- note: while, you *could* try searching for a 40 character vanity (eg a full ethereum address) most personal computers will struggle to return results with anything inputs longer than 8 characters in any reasonable time frame


###### Optional
Note: while of the following values are optional, for now you need pass the full set of arguments in order. (smarter flags coming later)

1) `nonceDepth`
- the number of nonces searched for each new address 
- note: the vanity contract is only accessible from a specific address/nonce combo. if you pass that nonce there's no going back. with a high value, you'll need to send a bunch of dummy transactions to get to the right nonce before deployment.
- valid input: integers between 1-100
- default: `10`

3) `searchDepth`
- the number of new key pairs generated and tested before halting
- note super high values here are likely to result in a crash before you approach the chance to overflow `Number.MAX_VALUE`
- valid input: any positive integer >0
- default: `1000000`

5) showProgress
- displays the most recent failed test address, the current search depth, and the nonce depth
- this is useful for validating everything is working/fun to watch but `console.log()` operations at this rate hurt performance
- valid input: `y` or `yes` || `n` or `no`
- default: `y` 

6) caseSensitive
- capital hex letter in your input are considered and matched against checksummed addresses
- the set of possible characters for each index of the address string increases from 16 to 22
- turned on, search is slower but more precise (eg, `1DAD` as input only returns `0x1DAD...` as valid
- turned off, search is faster but disregards checksums (eg, for `1DAD`, `0x1dad...`, `0x1daD...`, etc are all valid)  
- both versions produce valid ethereum addresses. In my experience there is little consistency in wether Ethereum applications/services/utilities display or require checksummed addresses
- valid input: `y` or `yes` || `n` or `no`
- default: `y` 

### Results

If/when a valid result is found. The following will be returned to your console and execution with halt.

`DEPTH:` the number of total searches (searchDepth reached * nonceDepth)
`GOAL:` the prefix target you gave as input
`CONTRACT:` the checksummed address of the contract if deployed at the specific nonce from the specific address bellow
`ADDRESS:` the checksummed address required to deploy this contract
`KEY:` private key for this address **in plain text!** 
`NONCE:` the magic nonce you must use to deploy your vanity contract
`MSG:` a reminder of the above
`WARNING:`a reminder to save the results somewhere secure as nothing is written to a file. (with the possible exception of any bash history logs, etc you have running automatically).

### Troubleshooting

Having trouble?

1. Try declaring the full absolute path to your node instance and the vain.js file: `/usr/local/bin/node /your/custom/directory/vain.js 0x1234`
2. No address found? The search space is the `nonceDepth` * `searchDepth`, increase either or both. Or search for a shorter prefix
3. Node/dependancy issues? Try downgrading to 10.x with nvm or your preferred version manager and install dependancies again
4. Performance Issues? Try turning off `showProgress` to stop those resource greedy `console.log()` running thousands of times a second
5. Taking too long? even low spec consumer machines should be able to find valid 4 character prefixes relatively quickly (on the order of 1-2 minutes). This is basically "mining" so each added character increases the difficulty level by at least an order or magnitude. The possible number of permutations to search through is something like `16!/(16−prefix.length)!` or with caseSensitivity on `22!/(22−prefix.length)!`. However, you are searching truncated versions of the much larger set of ethereum addresses (themselves a larger set of truncated public keys). I'm fuzzy on exactly how permutations/probability/birthday paradox applies here so will say simply: for each input.length += 1, search take waa...aay more time to find a result.
6. Still taking too long? Making node do synchronous cpu intensive work is pretty inefficient/dumb. Someone else has probably written a similar thing with parallelization, gpu/asic support, or in a language better suited to optimizing hashing and evaluating huge data sets. 

### Future Updates

- consolidate dependancies to use `ethereumjs-util`
- option for vanity suffixes
- add flags and enable independent toggling of default values
- support for `create2` addresses 
- refactor lazy code duplication into generalized methods
- front end interface

### Disclaimer 

I make no guarantees about the security of the key pairs generated. The source of randomness relies on a prng node library and the private key are displayed on your console in plain text, and possibly logged in your bash history. I strongly discourage using the address generated for anything other than displaying the contract you want with a vanity name. Then give any access control to that contract to an address you trust was generated with greater security.

### Thanks

Inspiration for and some code snippets borrowed/adapted from [vanity-eth](https://vanity-eth.tk/)
