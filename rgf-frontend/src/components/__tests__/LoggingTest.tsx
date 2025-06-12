import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logUserAction, useCurrentUser } from "@/utils/loggingUtils";

export function LoggingTest() {
  const [status, setStatus] = useState<string>("");
  const currentUser = useCurrentUser();

  const testLogging = async () => {
    try {
      setStatus("Logging test action...");
      await logUserAction(
        "Test Action",
        "This is a test log entry",
        currentUser
      );
      setStatus("Logging successful!");
    } catch (error) {
      console.error("Error in test logging:", error);
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Logging Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p>Current User: {currentUser ? JSON.stringify(currentUser) : "No user"}</p>
        </div>
        <Button onClick={testLogging} className="w-full">
          Test Logging
        </Button>
        {status && (
          <div className="mt-4 p-2 bg-gray-100 rounded">
            <p>{status}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 