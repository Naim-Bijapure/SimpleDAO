import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network goerli`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("YourContract", {
    from: deployer,
    // Contract constructor arguments
    args: [deployer],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // // Get the deployed contract
  // const yourContract = await hre.ethers.getContract("YourContract", deployer);

  // deploy my token
  await deploy("MyToken", {
    from: deployer,
    // Contract constructor arguments
    args: [],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  const myToken = await hre.ethers.getContract("MyToken", deployer);
  // console.log(`n-🔴 => myToken:`, myToken.address);

  await deploy("SimpleDAO", {
    from: deployer,
    // Contract constructor arguments
    args: ["SimpleDAO", myToken.address, 4],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  const simpleDAO = await hre.ethers.getContract("SimpleDAO", deployer);
  console.log(`n-🔴 => simpleDAO:`, simpleDAO.address);
  const mintRcpt = await myToken.mint(simpleDAO.address, 10000);
  const mintTx = await mintRcpt.wait();

  const mintRcpt1 = await myToken.mint("0x0fAb64624733a7020D332203568754EB1a37DB89", 10000);
  const mintTx1 = await mintRcpt.wait();

  // console.log(`n-🔴 => mintTx:`, mintTx);
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployYourContract.tags = ["YourContract", "MyToken", "SimpleDAO"];
