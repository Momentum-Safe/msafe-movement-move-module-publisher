import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { AddressWidgetContext, base, CopyButton, gray, PageHeader } from "@mavensafe/maven-ui";
import { inMSafeWallet, MSafeWalletName } from "@msafe/aptos-aip62-wallet";
import { MSafeWalletAdapter } from "@msafe/aptos-wallet-adapter";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import Container from "@mui/material/Container";
import { useSnackbar } from "notistack";
import { useEffect } from "react";
import DeployForm from "./components/DeployForm";
import { shortAddress } from "./utils";

export default function App() {
  const wallet = useWallet();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (!wallet.connected && inMSafeWallet()) {
      wallet.connect(MSafeWalletName);
    }
  }, [wallet.isLoading]);

  return (
    <AddressWidgetContext.Provider
      value={{
        updateAddress() {},
        loadAddress() {
          return {
            address: "",
            name: "",
          };
        },
        onCopySuccess() {
          enqueueSnackbar("Address is copied", { variant: "success" });
        },
      }}
    >
      <Container sx={{ mt: "48px" }}>
        <PageHeader
          mainTitle="Move Publish"
          subtitle="Publish move modules with MSafe multi-sig protection"
          action={
            <Button
              variant="contained"
              startIcon={wallet.connected && <img src={wallet.wallet?.icon} alt="logo" style={{ width: "20px" }} />}
              onClick={(e) => {
                if (!wallet.connected && inMSafeWallet()) {
                  wallet.connect(MSafeWalletName);
                } else if (wallet.connected) {
                  wallet.disconnect();
                }
              }}
              sx={{
                width: "180px",
                alignSelf: "end",
              }}
            >
              <Typography
                sx={{
                  fontSize: "1rem",
                  fontWeight: 400,
                  color: base.white,
                }}
              >
                {wallet.connected ? shortAddress(wallet.account?.address) : "Connect"}
              </Typography>
            </Button>
          }
          sx={{
            mb: "48px",
          }}
        />
        {wallet.connected ? (
          <Container maxWidth="sm">
            <Stack spacing={3}>
              <Stack spacing={2}>
                <Typography
                  sx={{
                    fontSize: "1.5rem",
                  }}
                >
                  Instructions
                </Typography>
                <Typography>
                  1. Replace the module address in <code>Move.toml</code> with your multi-sig account address:
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    component="code"
                    sx={{
                      flexGrow: 1,
                      border: `1px solid ${gray[200]}`,
                      borderRadius: "8px",
                      boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                      padding: "16px 24px",
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: base.secondary,
                    }}
                  >
                    {shortAddress(wallet.account?.address, 16, 16)}
                  </Box>
                  <CopyButton text={wallet.account?.address} message="Address is copied" />
                </Stack>
                <Typography>2. Run the following command to compile your move module:</Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    component="code"
                    sx={{
                      flexGrow: 1,
                      border: `1px solid ${gray[200]}`,
                      borderRadius: "8px",
                      boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                      padding: "16px 24px",
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: base.secondary,
                    }}
                  >
                    aptos move compile --save-metadata
                  </Box>
                  <CopyButton text="aptos move compile --save-metadata" message="Command is copied" />
                </Stack>
                <Typography>
                  3. Select the{" "}
                  <b>
                    <code>/build</code>
                  </b>{" "}
                  folder and deploy.
                </Typography>
              </Stack>
              <DeployForm onDeploy={() => {}} />
            </Stack>
          </Container>
        ) : (
          <Alert severity="info">Please connect to your MSafe multi-sig account first.</Alert>
        )}
      </Container>
    </AddressWidgetContext.Provider>
  );
}
