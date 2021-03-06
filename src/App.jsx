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
const BUILDSPACE_TWIITER = "https://twitter.com/_buildspace";
const OPENSEA_LINK = "https://testnets.opensea.io/assets";
const TOTAL_MINT_COUNT = 50;
const CONTRACT_ADDRESS = "0x12a1480c96db91E98b759C788d69a48e77BEC348";

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
      console.log("Make sure you have a metamask wallet");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    if (ethereum.networkVersion !== "4") {
      displayNetworkErrorToast();
      return;
    }

    //Check if we're authorized to access the user's wallet
    const accounts = await ethereum.request({ method: "eth_accounts" });

    //User can have multiple authorized accounts, we grab the first one if its there!
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);

      refreshAccountState(account, ethereum);

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

      if (ethereum.networkVersion !== "4") {
        displayNetworkErrorToast();
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

      refreshAccountState(accounts[0], ethereum);
      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      // setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  function refreshAccountState(account, ethereum) {
    setCurrentAccount(account);
    fetchMyCollections();
    getWalletInfo(ethereum);

    getTotalNFTsMintedSoFar();
  }

  const getWalletInfo = async (ethereum) => {
    const provider = new ethers.providers.Web3Provider(ethereum);

    const balance = await provider.getBalance(ethereum.selectedAddress);

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

        setupEventListener();
        getTotalNFTsMintedSoFar();

        setIsMinting(false);
        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );
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
  }, []);

  function handleChainChanged(_chainId) {
    // We recommend reloading the page, unless you must do otherwise
    window.location.reload();
  }
  React.useEffect(() => {
    const { ethereum } = window;
    if (ethereum) {
      ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  function handleAccountsChanges(accounts) {
    const { ethereum } = window;

    if (!ethereum) {
      alert("Please connect your MetaMask Wallet.");
      return;
    }

    if (ethereum.networkVersion !== "4") {
      displayNetworkErrorToast();
      return;
    }
    // Handle the new accounts, or lack thereof.
    // "accounts" will always be an array, but it can be empty.
    if (accounts.length > 0) {
      refreshAccountState(accounts[0], ethereum);
    }
  }

  React.useEffect(() => {
    const { ethereum } = window;
    if (ethereum) {
      ethereum.on("accountsChanged", handleAccountsChanges);
    }

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanges);
    };
  });

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
    <div className="flex items-center justify-around">
      {isMinting && (
        <img style={{ width: "5%" }} src={Blocks} alt="loading blocks" />
      )}
      <button
        onClick={askContractToMintNft}
        className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-lg"
      >
        {isMinting ? "Minting..." : "Mint NFT"}
      </button>
      {isMinting && (
        <img style={{ width: "5%" }} src={Blocks} alt="loading blocks" />
      )}
    </div>
  );

  return (
    <div className="h-screen">
      <div className="h-1/2">
        <div className="bg-gray-900 flex flex-col items-center h-full">
          <div className="w-full flex items-center justify-end">
            <div className="flex flex-col items-center">
              <div className="flex items-center">
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
                    <div className="text-white">
                      {walletInfo.address.slice(-3)}
                    </div>
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
              {isOnCorrectNetwork && (
                <p className="sub-text-sm mb-2">
                  You are on the Rinkeby Network
                </p>
              )}
            </div>
          </div>

          <div className="md:flex items-center w-full h-full">
            <div className="flex flex-col items-center md:w-1/2">
              <p className="my-2 lg:text-4xl text-3xl font-bold gradient-text">
                On-Chain Random Words
              </p>
              <p className="text-white md:text-2xl lg:text-3xl text-lg mb-2">
                ???? Get your EPIC NFT today! ????
              </p>
            </div>

            <div className="flex flex-col items-center md:w-1/2">
              <div className="flex flex-col items-center mt-4">
                {currentAccount === ""
                  ? renderNotConnectedContainer()
                  : renderMintUI()}
              </div>
              <div className="text-white my-2">
                Number of NFT minted so far: {numberMinted} / {TOTAL_MINT_COUNT}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="h-1/2 flex flex-col justify-between pt-16 md:pt-0">
        <div className="w-full flex flex-col items-center">
          <div className="text-white font-semibold my-3 md:text-3xl text-lg underline">
            My Collections
          </div>
          <div className="w-full grid grid-flow-row lg:grid-cols-5 md:grid-cols-3 grid-cols-2 gap-4 my-4 px-4">
            {myCollections.map((item, i) => (
              <div
                contentEditable="true"
                key={i}
                dangerouslySetInnerHTML={{ __html: atob(item) }}
              ></div>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center pb-8 w-full">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex items-center">
              <img
                alt="Twitter Logo"
                className="twitter-logo"
                src={twitterLogo}
              />
              <a
                className="footer-text"
                href={BUILDSPACE_TWIITER}
                target="_blank"
                rel="noreferrer"
              >
                A @_buildspace Project
              </a>
              <div style={{ marginLeft: "8px", marginRight: "8px" }}>????</div>
            </div>
            <div className="flex items-center">
              <a
                className="footer-text"
                href={TWITTER_LINK}
                target="_blank"
                rel="noreferrer"
              >{`built with ??? by @${TWITTER_HANDLE}`}</a>
            </div>
          </div>
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
