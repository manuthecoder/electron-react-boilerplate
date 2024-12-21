import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JSX } from "react";
import { Checkbox } from "./components/ui/checkbox";
import { Input } from "./components/ui/input";

function CheckboxGroup({
  label,
  checked = false,
  setChecked = () => {},
}: {
  label: string;
  checked?: boolean;
  setChecked?: any;
}) {
  return (
    <div className="flex flex-row items-center gap-2 mt-2">
      <Checkbox checked={checked} onChange={setChecked} />
      <p>{label}</p>
    </div>
  );
}

function Pironman() {
  const ipcHandle = (): void => window.electron.ipcRenderer.send("ping");

  return (
    <Card
      className="w-[350px]"
      style={{ ["WebkitAppRegion" as any]: "no-drag" }}
    >
      <CardHeader>
        <CardTitle>Pironman</CardTitle>
      </CardHeader>
      <CardContent>
        <p>RGB strip light color</p>
        <div className="flex flex-row items-center gap-2 mt-2">
          <Input placeholder="#000000" />
          <Button onClick={ipcHandle}>Set</Button>
        </div>
        <CheckboxGroup label="Colorful?" />
      </CardContent>
      <CardContent>
        <p>Fan temperature</p>
        <div className="flex flex-row items-center gap-2 mt-2">
          <Input placeholder="120" />
          <Button onClick={ipcHandle}>Set</Button>
        </div>
      </CardContent>
      <CardContent>
        <p>Screen display duration</p>
        <div className="flex flex-row items-center gap-2 mt-2">
          <Input placeholder="15s" />
          <Button onClick={ipcHandle}>Set</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HexLights() {
  const ipcHandle = (): void => window.electron.ipcRenderer.send("ping");

  return (
    <Card
      className="w-[350px]"
      style={{ ["WebkitAppRegion" as any]: "no-drag" }}
    >
      <CardHeader>
        <CardTitle>Hex Lights</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Color</p>
        <div className="flex flex-row items-center gap-2 mt-2">
          <Input placeholder="#000000" />
          <Button onClick={ipcHandle}>Set</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AmbientLighting() {
  const ipcHandle = (): void => window.electron.ipcRenderer.send("ping");

  return (
    <Card
      className="w-[350px]"
      style={{ ["WebkitAppRegion" as any]: "no-drag" }}
    >
      <CardHeader>
        <CardTitle>Ambient Lighting</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Color</p>
        <div className="flex flex-row items-center gap-2 mt-2">
          <Input placeholder="#000000" />
          <Button onClick={ipcHandle}>Set</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LockOnLeave() {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send("ping");

  return (
    <Card
      className="w-[350px]"
      style={{ ["WebkitAppRegion" as any]: "no-drag" }}
    >
      <CardHeader>
        <CardTitle>Lock on leave</CardTitle>
      </CardHeader>
      <CardContent>
        <CheckboxGroup label="Enabled" checked />
        <CheckboxGroup label="Mute this laptop's audio?" checked />
        <CheckboxGroup label="Turn off server lighting?" checked />
        <CheckboxGroup label="Turn off hexagon lighting?" checked />
        <CheckboxGroup label="Turn off ambient lighting?" checked />
      </CardContent>
    </Card>
  );
}

function App(): JSX.Element {
  return (
    <div className="p-16 flex flex-col gap-5">
      <h1 className="text-center mt-7 mb-3 text-3xl font-black">Functions</h1>
      <LockOnLeave />

      <h1 className="text-center mt-7 mb-3 text-3xl font-black">Components</h1>
      <Pironman />
      <HexLights />
      <AmbientLighting />
    </div>
  );
}

export default App;

