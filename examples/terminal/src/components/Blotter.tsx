import { EmptyState, Tabs } from "@perpetua/react/components";

const NOTE = "Account data requires a credential-connected venue. This demo runs the market-data surface only.";

export function Blotter() {
  return (
    <Tabs.Root defaultValue="positions" className="blotter">
      <Tabs.List className="blotter__tabs">
        <Tabs.Trigger value="positions" className="blotter__tab">
          Positions
        </Tabs.Trigger>
        <Tabs.Trigger value="orders" className="blotter__tab">
          Open Orders
        </Tabs.Trigger>
        <Tabs.Trigger value="fills" className="blotter__tab">
          Fills
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="positions" className="blotter__content">
        <EmptyState title="No open positions" description={NOTE} />
      </Tabs.Content>
      <Tabs.Content value="orders" className="blotter__content">
        <EmptyState title="No open orders" description={NOTE} />
      </Tabs.Content>
      <Tabs.Content value="fills" className="blotter__content">
        <EmptyState title="No fills" description={NOTE} />
      </Tabs.Content>
    </Tabs.Root>
  );
}
