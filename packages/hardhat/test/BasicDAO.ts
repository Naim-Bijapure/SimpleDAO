import { expect } from "chai";
import { ethers, network } from "hardhat";
import { MyToken, SimpleDAO, YourContract } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("BasicDao", function () {
  // We define a fixture to reuse the same setup in every test.

  let simpleDao: SimpleDAO;
  let myToken: MyToken;
  let yourContract: YourContract;
  let owner1: SignerWithAddress;
  let owner2: SignerWithAddress;
  let owner3: SignerWithAddress;
  before(async () => {
    [owner1, owner2, owner3] = await ethers.getSigners();
    console.log(`n-🔴 => before => owner1:`, owner1.address);
    console.log(`n-🔴 => before => owner2:`, owner2.address);

    const myTokenFactory = await ethers.getContractFactory("MyToken");
    myToken = (await myTokenFactory.deploy()) as MyToken;
    const myTokenAddress = (await myToken.deployed()).address;

    const simpleDaoFactory = await ethers.getContractFactory("SimpleDAO");
    simpleDao = (await simpleDaoFactory.deploy("SimpleDAO", myTokenAddress, 4)) as SimpleDAO;
    //     SimpleDao = await SimpleDao.deployed();

    const yourContractFactory = await ethers.getContractFactory("YourContract");
    yourContract = (await yourContractFactory.deploy(owner1.address)) as YourContract;
  });
  describe("Deployment", function () {
    it("Mint an token", async function () {
      const mintRcpt = await myToken.mint(owner1.address, 10000);
      const tx = await mintRcpt.wait();

      // transfer some amt
      const transferTokenRcpt = await myToken.transfer(simpleDao.address, 1000, { from: owner1.address });
      const transferTokenTx = await transferTokenRcpt.wait();

      // approve to owner 2
      const approveRcpt = await myToken.approve(owner2.address, 1000);
      const approveTx = await approveRcpt.wait();

      const balance1 = await myToken.balanceOf(owner1.address);
      console.log(`n-🔴 => balance1:`, balance1.toString());

      const balance2 = await myToken.balanceOf(owner2.address);
      console.log(`n-🔴 => balance2:`, balance2.toString());

      // simple dao balance
      const simpleDaoBalance = await myToken.balanceOf(simpleDao.address);
      console.log(`n-🔴 => simpleDaoBalance:`, simpleDaoBalance.toString());

      // check allowance
      // const allowance = await myToken.allowance(owner2.address, owner1.address);
      // console.log(`n-🔴 => allowance:`, allowance.toString());

      // get delegates

      const delegateRcpt = await myToken.delegate(owner1.address);
      const delegateTx = await delegateRcpt.wait();

      const delegates = await myToken.delegates(owner1.address);
      console.log(`n-🔴 => delegates:`, delegates);

      const greetValue = await yourContract.greeting();
      console.log(`n-🔴 => greetValue:`, greetValue);
    });

    it("Create proposal", async function () {
      let myTokenAddress = (await myToken.deployed()).address;
      const myTokenFactory = await ethers.getContractFactory("MyToken", myTokenAddress);

      // const transferCalldata = myTokenFactory.interface.encodeFunctionData("transfer", [owner2.address, 100]);
      // console.log(`n-🔴 => transferCalldata:`, transferCalldata);

      const transferCalldata = yourContract.interface.encodeFunctionData("setGreeting", ["cool man"]);
      console.log(`n-🔴 => transferCalldata:`, transferCalldata);
      myTokenAddress = yourContract.address;

      const proposalRcpt = await simpleDao.propose(
        [myTokenAddress],
        [0],
        [transferCalldata],
        "Proposal #1: Give grant to team",
      );

      const proposalTx = await proposalRcpt.wait();
      const proposalId = proposalTx?.events![0].args?.proposalId.toString();
      console.log(`n-🔴 => proposalId:`, proposalId);

      let latestBlock = await ethers.provider.getBlock("latest");
      console.log(`n-🔴 => latestBlock:`, latestBlock.number);

      await network.provider.send("hardhat_mine", ["0x100"]);

      // simpleDao.connect(owner1);
      // cast a vote
      const voteRcpt = await simpleDao.castVoteWithReason(proposalId, 1, "cool reason", {
        gasLimit: 200000,
      });
      const voteTx = await voteRcpt.wait();
      // console.log(`n-🔴 => voteTx:`, voteTx);

      // status
      let status = await simpleDao.state(proposalId);
      console.log(`n-🔴 => status:`, status);

      //  proposal deadline

      const proposalDeadline = await simpleDao.proposalDeadline(latestBlock.number);
      console.log(`n-🔴 => proposalDeadline:`, proposalDeadline.toString());

      // is voted
      const isVoted = await simpleDao.hasVoted(proposalId, owner1.address);
      console.log(`n-🔴 => isVoted:`, isVoted);

      // get  votes
      const votes = await simpleDao.getVotes(owner1.address, latestBlock.number);
      console.log(`n-🔴 => votes:`, votes.toString());

      // latestBlock = await ethers.provider.getBlock("latest");
      // console.log(`n-🔴 => latestBlock:`, latestBlock);

      // get quorum
      const quorum = await simpleDao.quorum(latestBlock.number);
      console.log(`n-🔴 => quorum:`, quorum.toString());

      // voting period
      // const votingPeriod = await simpleDao.votingPeriod();
      // console.log(`n-🔴 => votingPeriod:`, votingPeriod.toString());

      // get all proposed events
      // const eventFilter = simpleDao.filters.VoteCast();
      // const events = await simpleDao.queryFilter(eventFilter);
      // console.log(`n-🔴 => events:`, events);

      // await network.provider.send("hardhat_mine", ["0x100"]);

      latestBlock = await ethers.provider.getBlock("latest");
      console.log(`n-🔴 => latestBlock:`, latestBlock.number);

      await network.provider.send("hardhat_mine", ["0x100"]);

      status = await simpleDao.state(proposalId);
      console.log(`n-🔴 => status:`, status);

      // execute
      const descriptionHash = ethers.utils.id("Proposal #1: Give grant to team");
      console.log(`n-🔴 => descriptionHash:`, descriptionHash);
      const executeRcpt = await simpleDao.execute([myTokenAddress], [0], [transferCalldata], descriptionHash, {
        gasLimit: 200000,
      });
      const tx = await executeRcpt.wait();

      const balance2 = await myToken.balanceOf(owner2.address);
      console.log(`n-🔴 => balance2:`, balance2.toString());

      // simple dao balance
      const simpleDaoBalance = await myToken.balanceOf(simpleDao.address);
      console.log(`n-🔴 => simpleDaoBalance:`, simpleDaoBalance.toString());

      const greetValue = await yourContract.greeting();
      console.log(`n-🔴 => greetValue:`, greetValue);
    });
  });
});
