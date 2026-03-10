// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./DEXPair.sol";
import "./interfaces/IDEXFactory.sol";

contract DEXFactory is IDEXFactory {
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "DEXFactory: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "DEXFactory: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "DEXFactory: PAIR_EXISTS");

        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        DEXPair pairContract = new DEXPair{salt: salt}();
        pairContract.initialize(token0, token1);

        pair = address(pairContract);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length);
    }
}
