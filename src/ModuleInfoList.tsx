import { MovePackage } from "./lib/move";
import { TxnBuilderTypes } from "aptos";
import { Alert, Chip, List, ListItem, ListItemIcon, ListItemText, Stack } from "@mui/material";
import { Label, Link, LocalGasStation, Schedule, Start, ViewInAr } from "@mui/icons-material";
import dayjs from "dayjs";
import CoinText from "./CoinText";

export interface ModuleInfoListProps {
  movePackage?: MovePackage;
  transaction?: TxnBuilderTypes.RawTransaction;
}

export default function ModuleInfoList(props: ModuleInfoListProps) {
  const { movePackage, transaction } = props;
  if (!movePackage || !movePackage.metadata || !transaction) {
    return <Alert>Invalid move module </Alert>;
  }
  const { metadata } = movePackage;
  return (
    <List dense>
      <ListItem>
        <ListItemIcon>
          <Label />
        </ListItemIcon>
        <ListItemText primary="Module Name" secondary={metadata.name} />
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <ViewInAr />
        </ListItemIcon>
        <ListItemText primary="Module" secondary={metadata.modules.map((m) => m.name).join(",")} />
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <Link />
        </ListItemIcon>
        <ListItemText primary="Dependency" secondary={metadata.dependencies.map((d) => d.package_name).join(",")} />
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <Start />
        </ListItemIcon>
        <ListItemText primary="Sequence Number" secondary={transaction.sequence_number.toString()} />
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <LocalGasStation />
        </ListItemIcon>
        <ListItemText primary="Gas Fee" secondary={<CoinText value={transaction.gas_unit_price * transaction.max_gas_amount} />} />
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <Schedule />
        </ListItemIcon>
        <ListItemText primary="Expiration Time" secondary={dayjs.unix(Number(transaction.expiration_timestamp_secs)).toString()} />
      </ListItem>
    </List>
  );
}
