import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import React from "react";
import { ethers } from "ethers";
import myEpicNft from "./utils/MyEpicNFT.json";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Constants
const TWITTER_HANDLE = "_buildspace";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = "https://testnets.opensea.io/assets";
const TOTAL_MINT_COUNT = 50;
const CONTRACT_ADDRESS = "0x8A8Bb906Cf69d2CFD015311a916e5721b4bC1848";

const App = () => {
  const [currentAccount, setCurrentAccount] = React.useState("");
  const [numberMinted, setNumberMinted] = React.useState(0);

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

        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );

        getTotalNFTsMintedSoFar();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
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
          alert(
            `Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: ${OPENSEA_LINK}/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
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
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {currentAccount === ""
            ? renderNotConnectedContainer()
            : renderMintUI()}
        </div>
        <div style={{ color: "white" }}>
          Number of NFT minted so far: {numberMinted} / {TOTAL_MINT_COUNT}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default App;
