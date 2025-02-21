import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button, TextField } from "@mavensafe/maven-ui";
import { Alert, Autocomplete, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import { FormEvent, createRef, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { MoveParser, MovePublisher } from "../lib/move";

export interface DeployFormProps {
  onDeploy: () => void;
}

export interface DeployFormPayload {
  createResourceAccount: boolean;
  seed: string;
  seedEncoding: "Utf8" | "Hex";
}

export default function DeployForm({}: DeployFormProps) {
  const moduleSelector = createRef<HTMLInputElement>();
  const [parsing, setParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const wallet = useWallet();

  const form = useForm<DeployFormPayload>({
    mode: "all",
    values: {
      createResourceAccount: false,
      seed: "",
      seedEncoding: "Utf8",
    },
    defaultValues: { createResourceAccount: false },
  });

  const createResourceAccount = form.watch("createResourceAccount");

  useEffect(() => {
    if (moduleSelector.current !== null) {
      moduleSelector.current.setAttribute("webkitdirectory", "");
      moduleSelector.current.setAttribute("directory", "");
    }
  }, [moduleSelector]);

  const onSelect = async (e: FormEvent) => {
    const input = e.nativeEvent.target as HTMLInputElement;
    if (!input?.files?.length) {
      return;
    }

    setErrorMessage("");
    setParsing(true);

    try {
      const moveParser = new MoveParser(Array.from(input.files));
      const movePackage = await moveParser.parsePackage();
      const movePublisher = new MovePublisher(wallet, movePackage);
      const transaction = createResourceAccount
        ? await movePublisher.buildPublishWithResourceAccountTransaction(form.getValues("seed"), form.getValues("seedEncoding"))
        : await movePublisher.buildPublishModuleTransaction();
      const result = createResourceAccount
        ? await movePublisher.signPublishWithResourceAccountTransaction(form.getValues("seed"), form.getValues("seedEncoding"))
        : await movePublisher.signPublishModuleTransaction();
    } catch (e) {
      setErrorMessage(String(e));
    } finally {
      setParsing(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography sx={{ fontSize: "1.5rem", flexGrow: 1 }}>Deploy Move</Typography>
      {errorMessage && (
        <Alert color="error" severity="error">
          {errorMessage}
        </Alert>
      )}
      <Stack spacing={2}>
        <Controller
          control={form.control}
          name="createResourceAccount"
          render={({ field }) => {
            return <FormControlLabel control={<Switch {...field} />} label="Create resource account" />;
          }}
        />
        {createResourceAccount && (
          <Stack direction="row" spacing={2}>
            <Controller
              control={form.control}
              name="seed"
              render={({ field }) => {
                return <TextField {...field} disabled={!createResourceAccount} label="Seed" sx={{ width: "100%" }} />;
              }}
            />
            <Controller
              control={form.control}
              name="seedEncoding"
              render={({ field }) => {
                return (
                  <Autocomplete
                    {...field}
                    onChange={(_, v) => {
                      field.onChange(v);
                    }}
                    options={["Utf8", "Hex"]}
                    disabled={!createResourceAccount}
                    renderInput={(params) => {
                      return <TextField {...params} label="Seed Encoding" />;
                    }}
                    sx={{ width: "100%" }}
                  />
                );
              }}
            />
          </Stack>
        )}
      </Stack>
      <Button fullWidth color="primary" variant="contained" onClick={() => moduleSelector.current?.click()} loading={parsing}>
        Select & Deploy
        <input ref={moduleSelector} type="file" style={{ display: "none" }} onChange={onSelect} />
      </Button>
    </Stack>
  );
}
