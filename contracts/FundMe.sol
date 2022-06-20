// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

error FoundMe_NotOwner();

/// @title Contract or Crowdfunding
/// @author 0xoriok 
contract FundMe {
    using PriceConverter for uint256;

    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;

    // Could we make this constant?  /* hint: no! We should make it immutable! */
    address private immutable  i_owner;
    uint256 public constant MINIMUM_USD = 10 * 10 ** 18;
    
    AggregatorV3Interface public s_priceFeed;

    modifier onlyOwner {
        // require(msg.sender == owner);
        if (msg.sender != i_owner) revert FoundMe_NotOwner();
        _;
    }

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    /**
     * @notice This is a fund function
     */
    function fund() public payable {
        require(msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD, "You need to spend more ETH!");
        // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }
    
    
    
    function withdraw() payable onlyOwner public {
        for (uint256 funderIndex=0;
            funderIndex < s_funders.length;
            funderIndex++
            )
        {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        // // transfer
        // payable(msg.sender).transfer(address(this).balance);
        // // send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");
        // call
        (bool callSuccess, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }
   function cheaperWithdraw() public payable onlyOwner{
        address[] memory funders = s_funders;
        // mappings can't be in memory, sorry!
        for (uint256 funderIndex=0;
            funderIndex < funders.length;
            funderIndex++
            )
        {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        } 
        s_funders = new address[](0);
        (bool Success, ) = i_owner.call{value: address(this).balance}("");
        require(Success);
    }

    // View pure functions

    function getOwner() public view returns(address){
        return i_owner;
    }
    function getFunder(uint index) public view returns(address) {
        return s_funders[index];
    }
    function getaddressToAmountFunded (address funder) public view returns(uint256) {
        return s_addressToAmountFunded[funder];
    }
    function getPriceFeed () public view returns(AggregatorV3Interface) {
        return s_priceFeed;
    }

}

