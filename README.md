# VanityContractAddresses

A js simple script that generates vanity contract addresses by x keypairs and checking their first y nonces until the desired result is found. This is an adaption of script I originally wrote as part of the Delfi project at EthDenver 2019.

### About 

Ethereum contracts made with the `create` opcode are deterministic. They take an rlp encoded array of the deploying address and nonce, hash it into a public key, and extract the last 24 bytes.

### Run & Install

`git clone https://github.com/nicholashc/VanityContractAddresses.git`

`cd VanityContract`

### Example Commands

`node vain` 
-returns welcome message

`node vain 0xbabe` 
-begins search for address and nonce combination that will a matching contract prefix. Note that adding 0x is optional and will produce the result.

`node vain beefbeef 5 10000000 n n` 
-begins search with customized settings

### Parameters

0) `vanity`
- required
- the hex character prefix you are searching for
- 0x prepended is optional
- lengths between 1-40 are valid, though most computers will begin to struggle to return results with anything longer than 8 characters

Note: while of the following values are operation, you pass the full set of arguments.

1) NonceDepth
- the number of nonces searched for any new address 
- valid integers between 1-100
- default: 10

3) searchDepth
- the number of new key pairs generated and tested,
- any valid integer over 1,
- the script with stop execution if  it reaches max depth, before a valid answer is found,
- default: 1000000

5) showProgress
- format: y yes || n no
- console.logs() returns the non-match guesses as it runs 
- Useful to ensure everything is working properly
- Adds tiny reduction in overall speed
- default: true

6) caseSensitive
- format: y yes || n no
- Accepts capital hex letter inputs [A-F] and searches checksummed addresses for an exact match
- Note: increases search space
- default: true 


### Disclaimer 

I make no guarantees about the security of the key pairs generated. The source of randomness is pseudo random and the private key are displayed on your console in plain text.  

### Troubleshooting

1. Try declaring the full absolute path to your node instance and the vain.js file
2. No address found? Increase the nonce count and or search space
3. Node issues? Try downgrading to 10.x with nvm and install dependancies again
4. Performance Issues? Try turning off `showProgress`

### Future Updates

- support for `create2` addresses 
- option for vanity suffixes
- optimization of lazy repeated methods
- front end interface
- flags to toggle defaults more easily

### Thanks

Inspiration and some code snippets started from https://vanity-eth.tk/