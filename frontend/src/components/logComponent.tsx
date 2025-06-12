import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchLatestLogs } from "@/api/logging";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { HelpIcon } from "./HelpIcon";

interface LogEntry {
  id: number;
  userEmail: string;
  action: string;
  changeDetails: string;
  timestamp: string;
}

export function LogComponent() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowCount, setRowCount] = useState<number | null>(25);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Always fetch all logs first
        const data = await fetchLatestLogs(1000000);
        
        // Filter logs based on date range if dates are selected
        let filteredData = data;
        if (startDate || endDate) {
          filteredData = data.filter((log: LogEntry) => {
            const logDate = new Date(log.timestamp);
            
            // Set start date to beginning of day (00:00:00)
            const startOfDay = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : undefined;
            // Set end date to end of day (23:59:59.999)
            const endOfDay = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : undefined;

            if (startOfDay && endOfDay) {
              return logDate >= startOfDay && logDate <= endOfDay;
            } else if (startOfDay) {
              return logDate >= startOfDay;
            } else if (endOfDay) {
              return logDate <= endOfDay;
            }
            return true;
          });
        }

        // Apply row limit after date filtering
        if (rowCount !== null) {
          filteredData = filteredData.slice(0, rowCount);
        }
        
        setLogs(filteredData);
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [rowCount, startDate, endDate]);

  // Common table styles
  const tableStyles = "w-full table-auto border-collapse border border-border";
  const cellStyles = "p-3 align-middle border border-border";
  const headerCellStyles = "p-3 text-left font-medium text-muted-foreground border border-border bg-muted sticky top-[-1px]";

  const formatTimestamp = (timestamp: string) => {
    // Create date from UTC timestamp
    const date = new Date(timestamp);
    
    // Format the date in the user's local timezone
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Use the local timezone
    });
  };

  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CardTitle>Change Log</CardTitle>
            <HelpIcon 
              tooltipText="The change log shows all the actions that have been made to the data. Click to learn more!"
              helpPath="/helpChangeLog"
              size="md"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[200px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Start Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[200px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "End Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDateFilters}
                  className="w-full sm:w-auto"
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-muted-foreground">Rows:</span>
              <Select
                value={rowCount === null ? "all" : rowCount.toString()}
                onValueChange={(value) => setRowCount(value === "all" ? null : parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-[100px]">
                  <SelectValue placeholder="Select rows" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading logs...</div>
          ) : (
            <div className="border border-border rounded-md overflow-hidden">
              <div className="max-h-[500px] overflow-auto scrollbar-thin">
                <table className={tableStyles}>
                  <colgroup>
                    <col style={{ width: 'auto' }} />
                    <col style={{ width: 'auto' }} />
                    <col style={{ width: 'auto' }} />
                    <col style={{ width: 'auto' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className={headerCellStyles}>User Email</th>
                      <th className={headerCellStyles}>Action</th>
                      <th className={headerCellStyles}>Change Details</th>
                      <th className={headerCellStyles}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className={cellStyles}>{log.userEmail}</td>
                        <td className={cellStyles}>{log.action}</td>
                        <td className={cellStyles}>{log.changeDetails}</td>
                        <td className={cellStyles}>
                          {formatTimestamp(log.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 