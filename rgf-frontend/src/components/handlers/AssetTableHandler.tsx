import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2, Calendar, Filter } from "lucide-react";
import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {Pencil, Trash2} from "lucide-react";
import { normalizeStringDisplay } from "@/utils/normalizeData";

interface Field {
  fieldID: number;
  fieldName: string;
  fieldType: string;
  units?: string;
}

interface AssetData {
  assetID: number;
  assetTypeName: string;
  fieldValues: Record<string, {
    value: any;
    type: string;
    entryID: number;
    date?: string;
  }>;
}

interface TableHandlerProps {
  fields: Field[];
  assetData: AssetData[];
  selectedItem: any;
  handleStartEdit?: (item: any) => void;
  handleStartDelete?: (item: any) => void;
  showActions?: boolean;
}

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

// Utility function to process raw asset data
export function processAssetData(
  assets: { assetID: number; boolFields: string | null; textFields: string | null; intFields: string | null }[],
  assetTypeName: string = ''
): AssetData[] {
  return assets.map((asset) => {
    // Create a map to store field values
    const fieldValueMap: Record<string, { value: any; type: string; entryID: number; date?: string }> = {};

    // Process boolean fields
    if (asset.boolFields) {
      asset.boolFields.split(',').forEach((fieldStr: string) => {
        const [fieldName, value, date, entryID] = fieldStr.split(':');
        fieldValueMap[fieldName] = {
          value: value === '1' || value.toLowerCase() === 'true',
          type: 'bool',
          entryID: Number(entryID),
          date: date
        };
      });
    }

    // Process text fields
    if (asset.textFields) {
      asset.textFields.split(',').forEach((fieldStr: string) => {
        const [fieldName, value, date, entryID] = fieldStr.split(':');
        fieldValueMap[fieldName] = {
          value,
          type: 'text',
          entryID: Number(entryID),
          date: date
        };
      });
    }

    // Process integer fields
    if (asset.intFields) {
      asset.intFields.split(',').forEach((fieldStr: string) => {
        const [fieldName, value, date, entryID] = fieldStr.split(':');
        fieldValueMap[fieldName] = {
          value: Number(value),
          type: 'int',
          entryID: Number(entryID),
          date: date
        };
      });
    }

    return {
      assetID: asset.assetID,
      assetTypeName: assetTypeName,
      fieldValues: fieldValueMap
    };
  });
}

export function formatDateForDisplay(date: string | undefined): string {
  if (!date) return '';
  // Create date object and adjust for timezone
  const d = new Date(date);
  // Add the timezone offset to get the correct local date
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
  return d.toLocaleDateString();
}

export function AssetTableHandler({
  fields,
  assetData,
  selectedItem,
  handleStartEdit,
  handleStartDelete,
  showActions = true,
}: TableHandlerProps) {
  const [minimizedColumns, setMinimizedColumns] = useState<Record<string, boolean>>({});
  const [minimizedDateColumns, setMinimizedDateColumns] = useState<Record<string, boolean>>({});
  const [dateRanges, setDateRanges] = useState<Record<string, DateRange>>({});
  const [sortConfig, setSortConfig] = useState<{ field: string | null; direction: 'asc' | 'desc' | null }>({
    field: null,
    direction: null
  });

  // Set all date columns to minimized after initial render
  useEffect(() => {
    const minimizedState = fields.reduce((acc, field) => ({
      ...acc,
      [field.fieldName]: true
    }), {});
    setMinimizedDateColumns(minimizedState);
  }, [fields]);

  const toggleColumn = (fieldName: string) => {
    setMinimizedColumns(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const toggleDateColumn = (fieldName: string) => {
    setMinimizedDateColumns(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const setDateRange = (fieldName: string, range: DateRange) => {
    setDateRanges(prev => ({
      ...prev,
      [fieldName]: range
    }));
  };

  const clearDateRange = (fieldName: string) => {
    setDateRanges(prev => {
      const newRanges = { ...prev };
      delete newRanges[fieldName];
      return newRanges;
    });
  };

  const isDateInRange = (date: string | undefined, fieldName: string): boolean => {
    if (!date) return true;
    const range = dateRanges[fieldName];
    if (!range) return true;

    const dateObj = new Date(date);
    if (range.startDate && dateObj < range.startDate) return false;
    if (range.endDate && dateObj > range.endDate) return false;
    return true;
  };

  // Helper function to create a colgroup with dynamic widths
  const createColGroup = (numColumns: number) => {
    const cols = [];
    if (showActions) {
      cols.push(<col key="actions" style={{ width: '115px' }} />);
    }
    
    for (let i = 0; i < numColumns; i++) {
      // Set minimum width for value columns and date columns
      const isDateColumn = i % 2 === 1; // Every odd index is a date column
      const minWidth = isDateColumn ? '50px' : '150px';
      cols.push(<col key={i} style={{ width: 'auto', minWidth: minWidth }} />);
    }
    
    return <colgroup>{cols}</colgroup>;
  };

  // Common table styles
  const tableStyles = "w-full table-auto border-collapse border border-border";
  const cellStyles = "p-3 align-middle border border-border break-words whitespace-normal";
  const headerCellStyles = "p-3 text-left font-medium text-muted-foreground border border-border bg-muted sticky top-[-1px] whitespace-normal";
  const dateCellStyles = "p-3 align-middle border border-border text-sm text-muted-foreground whitespace-normal";

  const visibleFields = fields.filter(field => !minimizedColumns[field.fieldName]);
  const totalColumns = visibleFields.reduce((acc, field) => {
    return acc + (minimizedDateColumns[field.fieldName] ? 1 : 2);
  }, showActions ? 1 : 0);

  const filteredAssetData = assetData.filter(asset => {
    return visibleFields.every(field => {
      const fieldValue = asset.fieldValues[field.fieldName];
      return !fieldValue?.date || isDateInRange(fieldValue.date, field.fieldName);
    });
  });

  const handleSort = (fieldName: string) => {
    setSortConfig(prev => ({
      field: fieldName,
      direction: prev.field === fieldName && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedAssetData = React.useMemo(() => {
    if (!sortConfig.field || !sortConfig.direction) return filteredAssetData;

    return [...filteredAssetData].sort((a, b) => {
      const fieldName = sortConfig.field as string;
      const aDate = a.fieldValues[fieldName]?.date;
      const bDate = b.fieldValues[fieldName]?.date;

      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;

      const comparison = new Date(aDate).getTime() - new Date(bDate).getTime();
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredAssetData, sortConfig]);

  return (
    <div className="mt-4">
      <div className="border border-border rounded-md overflow-hidden">
        <div className="flex justify-end p-2 bg-muted border-b border-border">
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Fields
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {fields.map((field) => (
                  <DropdownMenuCheckboxItem
                    key={field.fieldName}
                    checked={!minimizedColumns[field.fieldName]}
                    onCheckedChange={() => toggleColumn(field.fieldName)}
                  >
                    {normalizeStringDisplay(field.fieldName)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Dates
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {fields.map((field) => (
                  <DropdownMenuCheckboxItem
                    key={field.fieldName}
                    checked={!minimizedDateColumns[field.fieldName]}
                    onCheckedChange={() => toggleDateColumn(field.fieldName)}
                    disabled={minimizedColumns[field.fieldName]}
                  >
                    {field.fieldName}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="max-h-[500px] overflow-auto scrollbar-thin">
          <div className="w-full">
            <table 
              className={tableStyles + " w-full"}
              data-testid="asset-table-handler"
              data-minimized-columns={JSON.stringify(minimizedColumns)}
              data-minimized-date-columns={JSON.stringify(minimizedDateColumns)}
              data-date-ranges={JSON.stringify(dateRanges)}
            >
              {createColGroup(totalColumns)}
              <thead>
                <tr>
                  {showActions && <th className={headerCellStyles}>Actions</th>}
                  {visibleFields.map((field) => (
                    <React.Fragment key={field.fieldName}>
                      <th className={headerCellStyles}>
                        {normalizeStringDisplay(field.fieldName)}
                      </th>
                      {!minimizedDateColumns[field.fieldName] && (
                        <th className={headerCellStyles}>
                          <div className="flex items-center justify-between">
                            <span>Date</span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleSort(field.fieldName)}
                                className="p-1 hover:bg-muted rounded"
                                type="button"
                              >
                                {sortConfig.field === field.fieldName ? (
                                  sortConfig.direction === 'asc' ? '↑' : '↓'
                                ) : '↕'}
                              </button>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                      "h-6 w-6 p-0",
                                      dateRanges[field.fieldName] && "bg-primary/10"
                                    )}
                                  >
                                    <Filter className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-4" align="end">
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <h4 className="font-medium">Start Date</h4>
                                      <Input
                                        type="date"
                                        value={dateRanges[field.fieldName]?.startDate ? 
                                          new Date(dateRanges[field.fieldName].startDate!).toISOString().split('T')[0] : 
                                          ''}
                                        onChange={(e) => {
                                          const date = e.target.value ? new Date(e.target.value) : null;
                                          setDateRange(field.fieldName, {
                                            ...dateRanges[field.fieldName],
                                            startDate: date
                                          });
                                        }}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <h4 className="font-medium">End Date</h4>
                                      <Input
                                        type="date"
                                        value={dateRanges[field.fieldName]?.endDate ? 
                                          new Date(dateRanges[field.fieldName].endDate!).toISOString().split('T')[0] : 
                                          ''}
                                        onChange={(e) => {
                                          const date = e.target.value ? new Date(e.target.value) : null;
                                          setDateRange(field.fieldName, {
                                            ...dateRanges[field.fieldName],
                                            endDate: date
                                          });
                                        }}
                                      />
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => clearDateRange(field.fieldName)}
                                    >
                                      Clear Filter
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        </th>
                      )}
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedAssetData.map((asset) => (
                  <tr 
                    key={asset.assetID}
                    className={selectedItem?.assetID === asset.assetID ? "bg-muted" : ""}
                  >
                    {showActions && (
                      <td className={cellStyles}>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartEdit?.(asset)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStartDelete?.(asset)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                    {visibleFields.map((field) => {
                      const fieldValue = asset.fieldValues[field.fieldName];
                      const isEnumField = field.fieldType.toLowerCase() === 'enum';
                      return (
                        <React.Fragment key={field.fieldName}>
                          <td className={cellStyles}>
                            {fieldValue ? (
                              fieldValue.type === 'bool' 
                                ? fieldValue.value ? 'Yes' : 'No'
                                : isEnumField
                                  ? normalizeStringDisplay(fieldValue.value)
                                  : fieldValue.value
                            ) : ''}
                          </td>
                          {!minimizedDateColumns[field.fieldName] && (
                            <td className={dateCellStyles}>
                              {fieldValue?.date ? formatDateForDisplay(fieldValue.date) : ''}
                            </td>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 