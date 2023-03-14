import { ethers } from "ethers";
import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";

import { fetchBalance, fetchBlockNumber } from "@wagmi/core";
import { useAccount, useContractEvent, useNetwork, useProvider, useSigner } from "wagmi";
import { toast } from "react-hot-toast";

import { Address } from "../components/scaffold-eth";
import hardhatContracts from "../generated/hardhat_contracts.json";
import AddressInput from "../components/scaffold-eth/AddressInput";

const Home: NextPage = () => {
  const { chain } = useNetwork();
  const [myTokenBalance, setMyTokenBalance] = useState<string>();
  const [proposals, setProposals] = useState<any[]>([]);
  const [simpleDao, setSimpleDao] = useState<any>();
  const [yourContract, setYourContract] = useState<any>();
  const [myToken, setMyToken] = useState<any>();
  const [blockNumber, setBlockNumber] = useState<number>(0);
  const [votingPower, setVotingPower] = useState<number>(0);
  const [toggle, setToggle] = useState<boolean>(false);
  const [sendAddress, setSendAddress] = useState<string>();
  const [amount, setAmount] = useState<number>();
  const [description, setDescription] = useState<string>();

  //@ts-ignore
  const simpleDaoAddress = chain && hardhatContracts[String(chain?.id)][0].contracts.SimpleDAO.address;
  //@ts-ignore
  const simpleDaoABI = chain && hardhatContracts[String(chain?.id)][0].contracts.SimpleDAO.abi;
  //@ts-ignore
  const myTokenAddress = chain && hardhatContracts[String(chain?.id)][0].contracts.MyToken.address;
  //@ts-ignore
  const myTokenABI = chain && hardhatContracts[String(chain?.id)][0].contracts.MyToken.abi;

  //@ts-ignore
  const yourContractAddress = chain && hardhatContracts[String(chain?.id)][0].contracts.YourContract.address;
  //@ts-ignore
  const yourContractABI = chain && hardhatContracts[String(chain?.id)][0].contracts.YourContract.abi;

  // wagmi hooks
  const { data: signer } = useSigner();
  const { address } = useAccount();

  // const { config } = usePrepareContractWrite({
  //   address: simpleDaoAddress,
  //   abi: simpleDaoABI,
  //   functionName: "propose",
  //   // args: [[myTokenAddress], [0], ["0x"], "Proposal #1: Give grant to team"],
  // });
  // console.log(`n-🔴 => config:`, config);
  // const { data, isLoading, isSuccess, write } = useContractWrite(config);
  // console.log(`n-🔴 => isLoading:`, isLoading);
  // console.log(`n-🔴 => isSuccess:`, isSuccess);
  // console.log(`n-🔴 => data:`, data);

  const loadBalance = async () => {
    const balance = await fetchBalance({
      address: simpleDaoAddress,
      token: myTokenAddress,
    });
    setMyTokenBalance(balance.value.toString());
  };

  const loadProposals = async () => {
    if (signer) {
      const simpleDao = new ethers.Contract(simpleDaoAddress, simpleDaoABI, signer);

      const eventProposalCreatedFilter = simpleDao.filters.ProposalCreated();
      const eventsProposalCreated = await simpleDao.queryFilter(eventProposalCreatedFilter);
      console.log(`n-🔴 => loadProposals => eventsProposalCreated:`, eventsProposalCreated);

      const eventProposalExecutedFilter = simpleDao.filters.ProposalExecuted();
      const eventsProposalExecuted = await simpleDao.queryFilter(eventProposalExecutedFilter);

      const executedProposals = eventsProposalExecuted.map(data => data?.args && data?.args.proposalId.toString());

      const proposals = eventsProposalCreated
        .map(data => {
          // filter out executed proposals
          if (
            data?.args &&
            data?.args.proposalId.toString() &&
            !executedProposals.includes(data?.args.proposalId.toString())
          ) {
            return {
              proposar: data?.args && data?.args.proposer.toString(),
              proposalId: data?.args && data?.args.proposalId.toString(),
              description: data?.args && data?.args.description,
              calldatas: data?.args && data?.args.calldatas,
            };
          }
        })
        .filter(data => data !== undefined);

      setProposals(proposals);

      setSimpleDao(simpleDao);

      const yourContract = new ethers.Contract(yourContractAddress, yourContractABI, signer);
      setYourContract(yourContract);

      const myToken = new ethers.Contract(myTokenAddress, myTokenABI, signer);
      setMyToken(myToken);

      const blockNumber = await fetchBlockNumber();
      setBlockNumber(blockNumber);

      const votes = await myToken.getVotes(address);
      setVotingPower(+votes.toString());
    }
  };

  useEffect(() => {
    if (myTokenAddress) {
      void loadBalance();
    }
  }, [myTokenAddress]);

  useEffect(() => {
    void loadProposals();
  }, [signer, toggle]);

  const onNewProposal = async () => {
    // get interface
    const yourContract = new ethers.Contract(yourContractAddress, yourContractABI);

    // const transferCalldata = yourContract.interface.encodeFunctionData("setGreeting", ["Yo man awesome"]);
    // console.log(`n-🔴 => transferCalldata:`, transferCalldata);

    const transferCalldata = myToken.interface.encodeFunctionData("transfer", [sendAddress, amount]);
    console.log(`n-🔴 => transferCalldata:`, transferCalldata);

    if (signer) {
      // const simpleDao = new ethers.Contract(simpleDaoAddress, simpleDaoABI, signer);

      const proposalRcpt = await simpleDao.propose([myTokenAddress], [0], [transferCalldata], description, {
        gasLimit: 200000,
      });

      const proposalTx = await proposalRcpt.wait();
      const proposalId = proposalTx?.events![0].args?.proposalId.toString();
      console.log(`n-🔴 => proposalId:`, proposalId);
    }
    setToggle(!toggle);
  };

  const onDelegateVote = async () => {
    // const blockNumber = await fetchBlockNumber();
    // console.log(`n-🔴 => onVote => blockNumber:`, blockNumber);

    // // const descriptionHash = ethers.utils.id("cool reason");
    // // console.log(`n-🔴 => descriptionHash:`, descriptionHash);
    // //
    // // const votingPeriod = await simpleDao.votingPeriod();
    // // console.log(`n-🔴 => onVote => votingPeriod:`, votingPeriod.toString());

    // const balance = await myToken.balanceOf(address);
    // console.log(`n-🔴 => onVote => balance:`, balance.toString());

    // const votes = await simpleDao.getVotes(address, blockNumber - 1);
    // console.log(`n-🔴 => onVote => votes:`, votes.toString());

    // const state = await simpleDao.state(proposalId);
    // console.log(`n-🔴 => onVote => state:`, state.toString());

    // // const hasVoted = await simpleDao.hasVoted(proposalId, address);
    // // console.log(`n-🔴 => onVote => hasVoted:`, hasVoted);

    // // const proposalVotes = await simpleDao.proposalVotes(proposalId);
    // // console.log(`n-🔴 => onVote => proposalVotes:`, proposalVotes);

    // const proposalDeadline = await simpleDao.proposalDeadline(proposalId);
    // console.log(`n-🔴 => onVote => proposalDeadline:`, proposalDeadline.toString());

    // // get quorum
    // const quorum = await simpleDao.quorum(blockNumber - 1);
    // console.log(`n-🔴 => quorum:`, quorum.toString());

    // delegate vote
    const delegateRcpt = await myToken.delegate(address);
    const delegateTx = await delegateRcpt.wait();
    console.log(`n-🔴 => onVote => delegateTx:`, delegateTx);
    setToggle(!toggle);
  };

  const onVote = async (proposalId: any) => {
    const hasVoted = await simpleDao.hasVoted(proposalId, address);

    const state = await simpleDao.state(proposalId);
    if (+state.toString() === 0) {
      toast.error("Currently voting is not activated ! try after few blocks minted");
      return;
    }

    if (!hasVoted) {
      const voteRcpt = await simpleDao.castVoteWithReason(proposalId, 1, "my reason", {
        gasLimit: 200000,
      });
      const voteTx = await voteRcpt.wait();
      console.log(`n-🔴 => voteTx:`, voteTx);
    }

    if (hasVoted) {
      toast.error("You already voted !");
    }
  };

  const onExecute = async (proposalId: any, description: any, calldatas: any) => {
    console.log(`n-🔴 => onExecute => description:`, description);
    // const delegateRcpt = await myToken.delegate(address);
    // const delegateTx = await delegateRcpt.wait();
    // console.log(`n-🔴 => onVote => delegateTx:`, delegateTx);

    // const transferCalldata = yourContract.interface.encodeFunctionData("setGreeting", ["Yo man awesome"]);
    // console.log(`n-🔴 => transferCalldata:`, transferCalldata);

    // const transferCalldata = myToken.interface.encodeFunctionData("transfer", [
    //   "0xDc33aB45de06754C667d438f1C975C3c45a986E1",
    //   100,
    // ]);
    // console.log(`n-🔴 => transferCalldata:`, transferCalldata);

    const descriptionHash = ethers.utils.id(description);
    console.log(`n-🔴 => descriptionHash:`, descriptionHash);
    const executeRcpt = await simpleDao.execute([myTokenAddress], [0], calldatas, descriptionHash, {
      gasLimit: 200000,
    });
    const tx = await executeRcpt.wait();

    console.log(`n-🔴 => onExecute => onExecute:`);
    setToggle(!toggle);
  };

  return (
    <>
      <Head>
        <title>Simple DAO</title>
        <meta name="description" content="Created with 🏗 scaffold-eth" />
      </Head>

      <div className="flex justify-between items--center flex--col flex-grow pt-10">
        {/* dao details */}
        <div className="card w-[30%] bg-base-100 shadow-xl h-1/5 m-2">
          <div className="card-body">
            <h2 className="card-title">Simple DAO</h2>
            <div>
              <Address address={simpleDaoAddress} />
              <div className="flex flex--col justify-start m-2 text-sm">
                <div>MyToken :</div>
                <div className="ml-2 text-gray-600">{myTokenBalance}</div>
              </div>
            </div>
            <div className="card-actions justify-end">
              {/* <button className="btn btn-primary" onClick={onNewProposal}>
                New proposal
              </button> */}
              <label htmlFor="my-modal" className="btn btn-primary">
                New proposal
              </label>
              {/* modal body */}
              <input type="checkbox" id="my-modal" className="modal-toggle" />
              <div className="modal">
                <div className="modal-box">
                  <h3 className="font-bold text-lg">Enter proposal details</h3>
                  <p className="py-4">
                    <AddressInput placeholder="Enter recipient address " onChange={value => setSendAddress(value)} />
                    <input
                      type="number"
                      placeholder="Enter amount"
                      className="input input-primary m-2"
                      onChange={event => setAmount(+event.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Enter Description"
                      className="input input-primary m-2"
                      onChange={event => setDescription(event.target.value)}
                    />
                  </p>
                  <div className="modal-action">
                    <label htmlFor="my-modal" className="btn" onClick={onNewProposal}>
                      Create proposal
                    </label>
                  </div>
                </div>
              </div>
            </div>
            {votingPower === 0 && (
              <div className="text-sm text-primary">
                Your voting power is 0 you need to mint some Mytokens and
                <button className="btn btn-warning btn-xs" onClick={onDelegateVote}>
                  Delegate
                </button>
                it !
              </div>
            )}
          </div>
        </div>
        {/* proposal list */}
        <div className="-card w-[70%] -bg-base-100 -shadow-xl m-2">
          <div className="-card-body">
            <h6 className="-card-title font-bold">Proposals</h6>
            <div>
              {proposals &&
                proposals.map(({ proposalId, description, proposar, calldatas }) => {
                  return (
                    <div key={proposalId} className="card bg-base-100 shadow-xl mt-2">
                      <div className="card-body">
                        <div className="flex justify-between">
                          <div className="flex justify-start">
                            <span className="m-2">Proposal ID:</span> <Address address={proposalId} />
                          </div>
                          <div className="flex justify-start">
                            <span className="m-2">Proposer:</span>
                            <Address address={proposar} format="short" />
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 m-2">{description}</div>
                        <div className="card-actions justify-end">
                          <button className="btn btn-primary" onClick={() => onVote(proposalId)}>
                            Vote
                          </button>

                          <button
                            className="btn btn-primary"
                            onClick={() => onExecute(proposalId, description, calldatas)}
                          >
                            Executed
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
