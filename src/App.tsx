import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/toaster";
import {
  CarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  StopCircleIcon,
} from "lucide-react";
import { useToast } from "./hooks/use-toast";

const App = () => {
  const [ipAddress, setIpAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [activeControls, setActiveControls] = useState<{
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
  }>({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });
  const { toast } = useToast();

  // Check device orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.orientation === 90 || window.orientation === -90);
    };

    // Initial check
    checkOrientation();

    // Add event listener for orientation changes
    window.addEventListener("orientationchange", checkOrientation);

    // Cleanup listener
    return () => {
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // Periodic command sending for held controls
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isConnected) {
      intervalId = setInterval(() => {
        Object.entries(activeControls).forEach(([direction, isActive]) => {
          if (isActive) {
            sendCommand(direction);
          }
        });
      }, 200); // Send command every 200ms while control is active
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeControls, isConnected]);

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch(`http://${ipAddress}/connect`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success) {
        setIsConnected(true);
        toast({
          title: "Connection Successful",
          description: `Connected to device at ${data.ip}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Unable to connect to the device",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Could not connect to the device",
        variant: "destructive",
      });
    }
  };

  const sendCommand = async (command: string) => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect to a device first",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `http://${ipAddress}/move?direction=${command}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.text();
      console.log(data);
    } catch (err) {
      console.error(err);
      toast({
        title: "Command Error",
        description: "Failed to send command",
        variant: "destructive",
      });
    }
  };

  const handleControlStart = (direction: string) => {
    setActiveControls((prev) => ({
      ...prev,
      [direction]: true,
    }));
  };

  const handleControlEnd = (direction: string) => {
    setActiveControls((prev) => ({
      ...prev,
      [direction]: false,
    }));
  };

  // Landscape Gaming Control Layout
  const LandscapeControls = () => (
    <div className="fixed inset-0 bg-gray-900 flex">
      <div className="w-1/2 flex items-center justify-center">
        {/* Left side controls (Directional) */}
        <div className="grid grid-cols-3 gap-4 p-4">
          <div className="col-start-2">
            <button
              onTouchStart={() => handleControlStart("forward")}
              onTouchEnd={() => handleControlEnd("forward")}
              onMouseDown={() => handleControlStart("forward")}
              onMouseUp={() => handleControlEnd("forward")}
              className={`p-4 rounded-full ${
                activeControls.forward ? "bg-blue-600" : "bg-blue-400"
              } text-white`}
            >
              <ArrowUpIcon />
            </button>
          </div>
          <button
            onTouchStart={() => handleControlStart("left")}
            onTouchEnd={() => handleControlEnd("left")}
            onMouseDown={() => handleControlStart("left")}
            onMouseUp={() => handleControlEnd("left")}
            className={`p-4 rounded-full ${
              activeControls.left ? "bg-blue-600" : "bg-blue-400"
            } text-white`}
          >
            <ArrowLeftIcon />
          </button>
          <button
            onTouchStart={() => handleControlStart("right")}
            onTouchEnd={() => handleControlEnd("right")}
            onMouseDown={() => handleControlStart("right")}
            onMouseUp={() => handleControlEnd("right")}
            className={`p-4 rounded-full ${
              activeControls.right ? "bg-blue-600" : "bg-blue-400"
            } text-white`}
          >
            <ArrowRightIcon />
          </button>
          <div className="col-start-2">
            <button
              onTouchStart={() => handleControlStart("backward")}
              onTouchEnd={() => handleControlEnd("backward")}
              onMouseDown={() => handleControlStart("backward")}
              onMouseUp={() => handleControlEnd("backward")}
              className={`p-4 rounded-full ${
                activeControls.backward ? "bg-blue-600" : "bg-blue-400"
              } text-white`}
            >
              <ArrowDownIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Right side controls (Action/Stop) */}
      <div className="w-1/2 flex items-center justify-center">
        <button
          onClick={() => sendCommand("stop")}
          className="p-6 bg-red-500 rounded-full text-white"
        >
          <StopCircleIcon size={48} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {isLandscape && isConnected ? (
        <LandscapeControls />
      ) : (
        <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-center mb-6">
            <CarIcon className="w-12 h-12 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">
              IoT Car Controller
            </h1>
          </div>

          {!isConnected ? (
            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <Label htmlFor="ipAddress" className="block mb-2">
                  Enter Device IP Address
                </Label>
                <Input
                  type="text"
                  id="ipAddress"
                  placeholder="192.168.1.100"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Connect
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="col-start-2"
                  onClick={() => sendCommand("forward")}
                >
                  <ArrowUpIcon className="mr-2" /> Forward
                </Button>

                <div className="col-span-3 flex justify-center space-x-4">
                  <Button variant="outline" onClick={() => sendCommand("left")}>
                    <ArrowLeftIcon className="mr-2" /> Left
                  </Button>
                  <Button variant="outline" onClick={() => sendCommand("stop")}>
                    <StopCircleIcon className="mr-2" /> Stop
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => sendCommand("right")}
                  >
                    Right <ArrowRightIcon className="ml-2" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="col-start-2"
                  onClick={() => sendCommand("back")}
                >
                  <ArrowDownIcon className="mr-2" /> Backward
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      <Toaster />
    </div>
  );
};

export default App;
