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
const OPENSEA_LINK = "https://testnets.opensea.io/assets";
const TOTAL_MINT_COUNT = 50;
const CONTRACT_ADDRESS = "0x8A8Bb906Cf69d2CFD015311a916e5721b4bC1848";

const App = () => {
  const [currentAccount, setCurrentAccount] = React.useState("");
  const [numberMinted, setNumberMinted] = React.useState(0);
  const [isMinting, setIsMinting] = React.useState(false);

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

      if (isOnCorrectNetwork) {
        setCurrentAccount(account);

        getTotalNFTsMintedSoFar();

        // Setup listener! This is for the case where a user comes to our site
        // and ALREADY had their wallet connected + authorized.
        setupEventListener();
      } else {
        displayNetworkErrorToast();
      }
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

      if (isOnCorrectNetwork) {
        setCurrentAccount(accounts[0]);

        // Setup listener! This is for the case where a user comes to our site
        // and connected their wallet for the first time.
        setupEventListener();
      } else {
        displayNetworkErrorToast();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getTotalNFTsMintedSoFar = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedWallet = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        const numMinted = await connectedWallet.getNumberOfNFTMinted();

        setNumberMinted(numMinted.toNumber());
        // setNumberMinted(await connectedWallet.getNumberOfNFTMinted());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const displayNetworkErrorToast = () =>
    toast("Please connect to the correct network.");

  const isOnCorrectNetwork =
    window.ethereum && window.ethereum.networkVersion === "4";

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        setIsMinting(true);
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedWallet = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        console.log("going to pop wallet now to pay gas...");
        let nftTxn = await connectedWallet.makeAnEpicNFT();

        console.log("Mining...please wait..");
        await nftTxn.wait();

        setIsMinting(false);
        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );

        getTotalNFTsMintedSoFar();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
      setIsMinting(false);
    }
  };

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (_, tokenId) => {
          displayMintResultToast(tokenId);
        });

        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  React.useEffect(() => {
    checkIfWalletIsConnected();
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
      Mint NFT
    </button>
  );

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">On-Chain Random Words</p>
          <p className="sub-text">🎁 Get your EPIC NFT today! 🎁</p>
          {currentAccount === ""
            ? renderNotConnectedContainer()
            : renderMintUI()}
          <div style={{ color: "white", marginTop: "8px" }}>
            Number of NFT minted so far: {numberMinted} / {TOTAL_MINT_COUNT}
          </div>
        </div>
        {isMinting && (
          <img style={{ width: "30%" }} src={Blocks} alt="loading blocks" />
        )}
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
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
