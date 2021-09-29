import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import React from "react";
import { ethers } from "ethers";
import myEpicNft from "./utils/MyEpicNFT.json";
import { ToastContainer, toast } from "react-toastify";
import Blocks from "./assets/Blocks.svg";
import "react-toastify/dist/ReactToastify.css";

// Constants
const TWITTER_HANDLE = "just_shiang";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const BUILDSPACE_TWIITER = "https://twitter.com/@_buildspace";
const OPENSEA_LINK = "https://testnets.opensea.io/assets";
const TOTAL_MINT_COUNT = 50;
const CONTRACT_ADDRESS = "0xB646598B2DCbddB32Ad6726528201D6EB0b4B1c2";

const useContract = () => {
  const { ethereum } = window;

  if (ethereum) {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      myEpicNft.abi,
      signer
    );

    return contract;
  }

  return null;
};

const App = () => {
  const [currentAccount, setCurrentAccount] = React.useState("");
  const [numberMinted, setNumberMinted] = React.useState(0);
  const [isMinting, setIsMinting] = React.useState(false);
  const [myCollections, setMyCollections] = React.useState([]);
  const [walletInfo, setWalletInfo] = React.useState({
    address: "",
    balance: "",
  });

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have a metamask");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    //Check if we're authorized to access the user's wallet
    const accounts = await ethereum.request({ method: "eth_accounts" });

    //User can have multiple authorized accounts, we grab the first one if its there!
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);

      setCurrentAccount(account);

      getTotalNFTsMintedSoFar();
      getWalletInfo(ethereum);

      // fetchMyCollections();

      // Setup listener! This is for the case where a user comes to our site
      // and ALREADY had their wallet connected + authorized.
      // setupEventListener();
    } else {
      console.log("No authorized account found");
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      if (!ethereum.isMetaMask) {
        alert("Please use MetaMask Wallet");
        return;
      }

      /*
       * Fancy method to request access to account.
       */
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      /*
       * Boom! This should print out public address once we authorize Metamask.
       */
      console.log("Connected", accounts[0]);

      setCurrentAccount(accounts[0]);
      getWalletInfo(ethereum);

      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      // setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  const getWalletInfo = async (ethereum) => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    // Get the balance of an account (by address or ENS name, if supported by network)
    const balance = await provider.getBalance("rinkeby.eth");
    // { BigNumber: "2337132817842795605" }

    // Often you need to format the output to something more user-friendly,
    // such as in ether (instead of wei)
    setWalletInfo({
      address: ethereum.selectedAddress,
      balance: Number(ethers.utils.formatEther(balance)).toFixed(2),
    });
  };

  const fetchMyCollections = async () => {
    const contract = useContract();

    if (contract) {
      try {
        const collections = await contract.getMyCollections();

        setMyCollections(collections);
      } catch (error) {
        console.log(error);
      }
    } else {
      console.log("Ethereum object doesn't exist!");
    }
  };

  const getTotalNFTsMintedSoFar = async () => {
    const contract = useContract();

    if (contract) {
      try {
        const numMinted = await contract.getNumberOfNFTMinted();

        setNumberMinted(numMinted.toNumber());
      } catch (error) {
        console.log(error);
      }
    } else {
      console.log("Ethereum object doesn't exist!");
    }
  };

  const displayNetworkErrorToast = () =>
    toast("Please connect to the correct network.");

  const isOnCorrectNetwork =
    window.ethereum && window.ethereum.networkVersion === "4";

  const askContractToMintNft = async () => {
    const contract = useContract();

    if (contract) {
      setIsMinting(true);
      try {
        console.log("going to pop wallet now to pay gas...");
        let nftTxn = await contract.makeAnEpicNFT();

        console.log("Mining...please wait..");
        await nftTxn.wait();

        setIsMinting(false);
        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );

        getTotalNFTsMintedSoFar();

        setupEventListener();
      } catch (error) {
        setIsMinting(false);
        console.log(error);
      }
    } else {
      console.log("Ethereum object doesn't exist!");
    }
  };

  // Setup our listener.
  const setupEventListener = async () => {
    const contract = useContract();

    if (contract) {
      // THIS IS THE MAGIC SAUCE.
      // This will essentially "capture" our event when our contract throws it.
      // If you're familiar with webhooks, it's very similar to that!
      contract.on("NewEpicNFTMinted", (_, tokenId, collections) => {
        displayMintResultToast(tokenId);
        setMyCollections(collections);
      });

      console.log("Setup event listener!");
    } else {
      console.log("Ethereum object doesn't exist!");
    }
  };

  React.useEffect(() => {
    checkIfWalletIsConnected();
    if (!isOnCorrectNetwork) {
      displayNetworkErrorToast();
    } else {
      fetchMyCollections();
    }
  }, []);

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const displayMintResultToast = (tokenId) => {
    return toast(
      <MintResultToast
        link={`${OPENSEA_LINK}/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`}
      />
    );
  };

  /*
   * We want the "Connect to Wallet" button to dissapear if they've already connected their wallet!
   */
  const renderMintUI = () => (
    <button
      onClick={askContractToMintNft}
      className="cta-button connect-wallet-button"
    >
      {isMinting ? "Minting..." : "Mint NFT"}
    </button>
  );

  return (
    <div className="bg-gray-900 h-full">
      <div className="w-full max-h-14 flex items-center justify-end">
        {walletInfo.address !== "" && (
          <div
            style={{
              position: "relative",
              width: "130px",
            }}
            className="text-white font-semibold p-4 bg-indigo-700 flex items-center mt-2"
          >
            <div className="whitespace-nowrap overflow-ellipsis overflow-hidden">
              {walletInfo.address}
            </div>
            <div className="text-white">{walletInfo.address.slice(-3)}</div>
          </div>
        )}
        {walletInfo.balance !== "" && (
          <div
            style={{
              position: "relative",
              width: "130px",
            }}
          >
            <div className="text-white font-semibold p-4 bg-green-400 mt-2 mr-2 text-center">
              {walletInfo.balance} ETH
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col items-center justify-around h-full">
        <div className="flex flex-col items-center header-container">
          <p className=" my-2 header gradient-text">On-Chain Random Words</p>
          <p className="sub-text mb-2">🎁 Get your EPIC NFT today! 🎁</p>
          {isOnCorrectNetwork && (
            <p className="sub-text-sm mb-2">You are on the Rinkeby Network</p>
          )}
          <div className="flex flex-col items-center">
            {currentAccount === ""
              ? renderNotConnectedContainer()
              : renderMintUI()}
            {isMinting && (
              <img style={{ width: "20%" }} src={Blocks} alt="loading blocks" />
            )}
          </div>
          <div className="text-white my-2">
            Number of NFT minted so far: {numberMinted} / {TOTAL_MINT_COUNT}
          </div>
        </div>

        <div className="w-full flex flex-col items-center">
          <div className="text-white font-semibold my-3 text-3xl underline">
            My Collections
          </div>
          <div className="w-full grid grid-flow-row grid-cols-4 gap-4 my-4 px-4">
            {myCollections.map((item, i) => (
              <div
                contentEditable="true"
                key={i}
                dangerouslySetInnerHTML={{ __html: atob(item) }}
              ></div>
            ))}
          </div>
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={BUILDSPACE_TWIITER}
            target="_blank"
            rel="noreferrer"
          >
            A @_buildspace Project
          </a>
          <div style={{ marginLeft: "8px", marginRight: "8px" }}>🦄</div>
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built with ❤ by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

function MintResultToast({ link }) {
  return (
    <div>
      <p>
        Hey there! We've minted your NFT and sent it to your wallet. It may be
        blank right now. It can take a max of 10 min to show up on OpenSea.
      </p>
      <a href={link} target="_blank" rel="noreferrer">
        View your NFT on OpenSea!
      </a>
    </div>
  );
}

export default App;
