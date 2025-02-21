import { Network } from "@aptos-labs/ts-sdk";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { MavenProvider, Toast } from "@mavensafe/maven-ui";
import { MSafeWallet } from "@msafe/aptos-aip62-wallet";
import { MSafeWalletAdapter } from "@msafe/aptos-wallet-adapter";
import { SnackbarProvider } from "notistack";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";

const msafeWallet = new MSafeWalletAdapter();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MavenProvider>
      <AptosWalletAdapterProvider plugins={[msafeWallet]} autoConnect={false}>
        <SnackbarProvider
          maxSnack={4}
          autoHideDuration={3500}
          Components={{
            default: Toast,
            error: Toast,
            success: Toast,
            warning: Toast,
            info: Toast,
          }}
        >
          <App />
        </SnackbarProvider>
      </AptosWalletAdapterProvider>
    </MavenProvider>
  </React.StrictMode>
);
