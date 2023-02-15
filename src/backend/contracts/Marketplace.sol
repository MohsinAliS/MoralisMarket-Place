// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC721.sol";
import "hardhat/console.sol";

error BasicNft__RoyalityFeesPercentageLimitExceed();
error PleaseMakeAllowanceFirst();
  

contract Marketplace is ReentrancyGuard, Ownable{
    
    address payable public immutable feeAccount; 
    uint256 public itemCount;
    uint256 public totalVolume;
    uint256 public totalAuctionCompleted;
    IERC20 token;


    event Offered(
        uint256 itemId,
        address indexed nft,
        uint256 tokenId,
        uint256 price,
        address indexed seller
    );
    
    event Bought(
        uint256 itemId,
        address indexed nft,
        uint256 tokenId,
        uint256 price,
        address indexed seller,
        address indexed buyer
    );

    
    
    struct Owner {
    uint256 nftId;
    uint256 _royality;
    address owner;
    bool royality;
    }

    struct Item {
        uint256 itemId;
        IERC721 nft;
        uint256 tokenId;
        uint256 price;
        address payable seller;
        bool sold;
    }


    struct AuctionDetails {
        bool auction;
        uint256 itemId;
        // Current owner of NFT
        address payable seller;
        // Price (in wei) at beginning of auction
        uint256 basePrice;
        // Highest bidder
        address highestBidder;
        // Highest bid (in wei)
        uint256 highestBid;
        // Duration (in seconds) of auction
        uint256 endTime;
        // Time when auction started
        uint256 starTime;
        // To check if the auction has ended
        bool ended;
    }

    struct Bid {
        // Bidder's address
        address bidder;
        // Bidders amount
        uint256 amount;
        // Time
        uint256 biddingUnix;
    }

    struct MakeOffer {
        uint256 amount;
        address buyer;
    }


    // itemId -> Item
    mapping(uint256 => Item) public items;
    mapping(uint256 => MakeOffer) public makeoffer;
    mapping(uint256 => AuctionDetails) private _auctionDetail;
    mapping(address => mapping(uint256 => uint256)) public payedBids;
    mapping(uint256 => Bid[]) private auctionBids;
    mapping(IERC721 => Owner) private first_owner;
 

    receive() external payable {}
    fallback() external payable {}

    constructor(address _feePercent,IERC20 _token) {
        feeAccount = payable(_feePercent);
        token = _token;
    }

    // Make item to offer on the marketplace
    function makeItem(
        IERC721 _nft,
        uint256 _tokenId,
        uint256 _price,
        uint256 _royality
    ) external nonReentrant {
        require(_price > 0, "Price must be greater than zero");
        

        if(_royality > 1000) {
            revert  BasicNft__RoyalityFeesPercentageLimitExceed();
         }

        if(first_owner[_nft].royality == false){
        first_owner[_nft]=Owner(_tokenId,_royality,msg.sender,true);
        }
        
        // increment itemCount
        itemCount++;
        // transfer nft
        _nft.transferFrom(msg.sender, address(this), _tokenId);
        // add new item to items mapping
        items[itemCount] = Item(
            itemCount,
            _nft,
            _tokenId,
            _price,
            payable(msg.sender),
            false
        );
        // emit Offered event
        emit Offered(itemCount, address(_nft), _tokenId, _price, msg.sender);
    }

    function purchaseItem(uint _itemId) external payable nonReentrant {
        require(_auctionDetail[_itemId].auction == false, "Auction Not End");
        uint256 marketTax = getTaxPrice(_itemId);
        Item storage item = items[_itemId];
        require(_itemId > 0 && _itemId <= itemCount, "item doesn't exist");
        // require(msg.value >= _totalPrice, "not enough ether to cover item price and market fee");
        require(!item.sold, "item already sold");
        //Royality Fees
        address firstOwner = first_owner[item.nft].owner;
        uint256 royality = first_owner[item.nft]._royality;

        uint256 temp = getRoyalityFees(item.price, royality);
        // pay seller and feeAccount
        feeAccount.transfer(marketTax);
        payable(firstOwner).transfer(temp);
        item.seller.transfer(item.price - (marketTax + temp));
        // update item to sold
        item.sold = true;
        // transfer nft to buyer
        item.nft.transferFrom(address(this), msg.sender, item.tokenId);
        // emit Bought event
        emit Bought(
            _itemId,
            address(item.nft),
            item.tokenId,
            item.price,
            item.seller,
            msg.sender
        );
    }

    function getTaxPrice(uint256 _itemId) private view returns (uint256) {
        return (items[_itemId].price / 10000) * 250;
    }

    function getTaxPriceForAmount(uint256 _price) private pure returns (uint256) {
        return (_price / 10000) * 250;
    }

    function getRoyalityFees(
        uint256 _price,
        uint256 noOfBips
    ) private pure returns (uint256) {
        return (_price / 10000) * noOfBips;
    }

   
    /////////////////////////////////// This is Auction /////////////////////////////

    //This function for createAuction
    function createAuction(
        IERC721 _nft,
        uint256 _tokenId,
        uint256 _basePrice,
        uint256 _royality,
        uint256 endTime
    ) public {
        require(_basePrice > 0, "Price must be greater than zero");

        if(_royality > 1000) {
            revert  BasicNft__RoyalityFeesPercentageLimitExceed();
         }

        if(first_owner[_nft].royality == false){
        first_owner[_nft]=Owner(_tokenId,_royality,msg.sender,true);
        }
        
        // increment itemCount
        itemCount++;
        // transfer nft
        _nft.transferFrom(msg.sender, address(this), _tokenId);

        endTime = endTime * 1 seconds;
        endTime = block.timestamp + endTime;
        // add new item to items mapping
        _auctionDetail[itemCount] = AuctionDetails(
            true,
            itemCount,
            payable(msg.sender),
            _basePrice,
            address(0),
            0,
            endTime,
            block.timestamp,
            false
        );
        items[itemCount] = Item(
            itemCount,
            _nft,
            _tokenId,
            _basePrice,
            payable(msg.sender),
            false
        );
    }

    //This funtion for make Bid
    //first call approve function
    function bid(uint256 itemId, uint256 _amount) public payable {
        // msg.sender -> address parameter

        AuctionDetails memory auction = _auctionDetail[itemId];
        require(auction.ended == false, "Auction has ended");
        require(auction.seller != address(0), "Auction does not exist");

        // end = auction.ended;
        // _updateStatus(itemId);

        if (block.timestamp < auction.endTime) {
            //uint256 amount = payedBids[_msgSender()][_nftContract][_tokenId];

            uint256 amount = payedBids[msg.sender][itemId];

            require(
                auction.highestBid < _amount  &&
                    auction.basePrice <= _amount ,
                "Please send more funds"
            );
            require(
                msg.sender != auction.seller,
                "You cannot bid in your own auction"
            );
            require(
            token.balanceOf(msg.sender)>=_amount,
            "you Dont Have Balance"
            );   

            uint256 allowance = token.allowance(_msgSender(), address(this));
            if(allowance ==_amount){
            payedBids[msg.sender][itemId] = _amount;
            amount = payedBids[msg.sender][itemId];

            auction.highestBid = amount;
            auction.highestBidder = msg.sender;
            auctionBids[itemId].push(Bid(msg.sender, amount, block.timestamp));
            _auctionDetail[itemId] = auction;
            totalVolume += _amount;
            }
        }
    }

    //This function is concludeAuction finilise the highest bider
    function concludeAuction(
        uint256 itemId,
        address _msgSender
    ) public payable {
        AuctionDetails memory auction = _auctionDetail[itemId];
        require(
            _msgSender == _auctionDetail[itemId].highestBidder,
            "You are not authorized to conclude the auction"
        );
        require(auction.endTime < block.timestamp, "Auction Time remaining");

        bool ended = _checkAuctionStatus(itemId);

        if (!ended) {
            _updateStatus(itemId);
        }
        Item storage item = items[itemId];
        item.nft.transferFrom(address(this), msg.sender, item.tokenId);

        // update item to sold
        item.sold = true;
        // emit Bought event
        emit Bought(
            itemId,
            address(item.nft),
            item.tokenId,
            item.price,
            item.seller,
            msg.sender
        );

        address firstOwner = first_owner[item.nft].owner;
        uint256 royality = first_owner[item.nft]._royality;

        delete payedBids[auction.highestBidder][itemId];
        uint256 payment = auction.highestBid * 1 wei;
        uint256 temp = getRoyalityFees(payment, royality);
        uint256 marketTax = getTaxPriceForAmount(payment);
        
        // feeAccount.transfer(marketTax);
        // payable(firstOwner).transfer(temp);
        // item.seller.transfer(payment - (marketTax + temp));
        
        token.transferFrom(auction.highestBidder,feeAccount,marketTax);
        token.transferFrom(auction.highestBidder,firstOwner,temp);
        token.transferFrom(auction.highestBidder,item.seller,(payment-(marketTax + temp)));
        
        totalAuctionCompleted++;
    }


    //This function is use for is Auction End or Not
    function _checkAuctionStatus(uint256 itemId) public view returns (bool) {
        AuctionDetails memory auction = _auctionDetail[itemId];
        require(
            auction.seller != address(0),
            "Auction for this NFT is not in progress"
        );
        return auction.ended;
    }

    //This Function for change status
    function _updateStatus(uint256 itemId) public {
        //private
        AuctionDetails memory auction = _auctionDetail[itemId];
        require(auction.ended == false, "This auction has Ended");

        if (block.timestamp > auction.endTime) {
            auction.ended = true;
        }
        _auctionDetail[itemId] = auction;
        _auctionDetail[itemId].auction = false;
    }

    function isAuction(uint256 itemId) public view returns (bool) {
        if (_auctionDetail[itemId].auction == true) {
            return true;
        } else {
            return false;
        }
    }

    function getLastTime(uint256 itemId) public view returns (uint256) {
        AuctionDetails memory auction = _auctionDetail[itemId];
        return auction.endTime;
    }

    // cancel offer on the marketplace
    function cancelListing(uint256 itemId) external nonReentrant {
        Item storage item = items[itemId];
        require(item.seller == msg.sender, "you areNot allow to cancel list");
        // increment itemCount
        // itemCount ++;
        // transfer nft
        item.nft.transferFrom(address(this), item.seller, item.tokenId);
        item.sold = true;
    }

    
    
    //
    function cancellAuction(uint256 itemId,address _msgSender) payable public { 
  
    AuctionDetails memory auction = _auctionDetail[itemId]; 
    require(_msgSender == _auctionDetail[itemId].seller, 'You are not Owner of this NFT' ); 
    require(auction.endTime < block.timestamp,"Auction Time remaining"); 

    bool ended = _checkAuctionStatus(itemId); 
   
    if(!ended){ 
    _updateStatus(itemId); 
    } 
    Item storage item = items[itemId];
    item.nft.transferFrom(address(this), msg.sender, item.tokenId);
        
    // update item to sold
    item.sold = true;

    }

 
    function getHighestBid(uint256 itemId) public view returns (uint256) {
        AuctionDetails memory auction = _auctionDetail[itemId];
        return auction.highestBid;
    }

    function getHighestBidder(uint256 itemId) public view returns (address) {
        AuctionDetails memory auction = _auctionDetail[itemId];
        return auction.highestBidder;
    }


    

    ////////////////// MakeOffer /////////////////////////

    //first call approve function of IERC20 
    function makeOffer(uint256 itemId, uint256 _amount) public {
        
        Item storage item = items[itemId];
        MakeOffer memory offer = makeoffer[itemId];

    require(offer.amount < _amount,
            "please increase your offer ");
    
    require(!item.sold,"Id Is Sold");
    require(
            token.balanceOf(_msgSender())>=_amount,
            "you Dont Have Balance"
            ); 
        uint256 allowance = token.allowance(_msgSender(), address(this));
        if(allowance ==_amount){
        makeoffer[itemId] = MakeOffer(_amount,_msgSender());
        }
        else{
            revert PleaseMakeAllowanceFirst();
        }
    }
    

    function getOffer(uint256 itemId) public view returns (uint256, address) {
        MakeOffer memory offer = makeoffer[itemId];
        return (offer.amount, offer.buyer);
    }

    function acceptOffer(uint256 _itemId) public {
        MakeOffer memory offer = makeoffer[_itemId];
        Item storage item = items[_itemId];
        
        require(msg.sender == item.seller,"you are Not owner");
        require(_itemId > 0 && _itemId <= itemCount, "item doesn't exist");
        // require(msg.value >= _totalPrice, "not enough ether to cover item price and market fee");
        require(!item.sold, "item already sold");
        
        //Feeses
        uint256 marketTax = getTaxPriceForAmount(offer.amount);
        uint256 royality = first_owner[item.nft]._royality;
        address firstOwner = first_owner[item.nft].owner;

        uint256 temp = getRoyalityFees(offer.amount, royality);
        // pay amounts
        token.transferFrom(offer.buyer,feeAccount,marketTax);
        token.transferFrom(offer.buyer,firstOwner,temp);
        token.transferFrom(offer.buyer,item.seller,(offer.amount-(marketTax + temp)));
        
        // update item to sold
        item.sold = true;
        // transfer nft to buyer
        item.nft.transferFrom(address(this), offer.buyer, item.tokenId);

        delete makeoffer[_itemId];
        // emit Bought event
        emit Bought(
            _itemId,
            address(item.nft),
            item.tokenId,
            item.price,
            item.seller,
            offer.buyer
        );
    }

}
