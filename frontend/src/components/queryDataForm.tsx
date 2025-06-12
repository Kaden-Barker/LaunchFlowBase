import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormItem, FormMessage, FormField } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { searchAI } from "../api/searchAI";
import { fetchField } from "../api/field";
import { Search, Download } from "lucide-react";
import { AssetTableHandler, processAssetData, formatDateForDisplay } from "./handlers/AssetTableHandler";
import { CustomSwitch } from "@/components/ui/switch";
import { HelpIcon } from "./HelpIcon";

const searchSchema = z.object({
    query: z.string().min(1, { message: "Query cannot be empty" }),
});

export function QueryForm() {
    const [rawData, setRawData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dslQuery, setDslQuery] = useState<string | { dslQuery: string } | null>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [fields, setFields] = useState<any[]>([]);
    const [assetTypeID, setAssetTypeID] = useState<number | null>(null);
    const [useAI, setUseAI] = useState(true);

    const form = useForm<z.infer<typeof searchSchema>>({
        resolver: zodResolver(searchSchema),
        defaultValues: {
            query: "",
        },
    });

    // Fetch fields when assetTypeID changes
    useEffect(() => {
        const fetchFields = async () => {
            if (assetTypeID) {
                try {
                    const fetchedFields = await fetchField(assetTypeID);
                    setFields(fetchedFields);
                } catch (error) {
                    console.error("Error fetching fields:", error);
                    setError("Failed to fetch fields");
                }
            }
        };

        fetchFields();
    }, [assetTypeID]);

    const onSubmit = async (formData: z.infer<typeof searchSchema>) => {
        console.log("Search submitted:", formData);
        setLoading(true);
        setError(null);
        setDslQuery(null);
        setSelectedItem(null);
    
        try {
            // Pass useAI state to searchAI function
            const searchResults = await searchAI(formData.query, useAI);            
            const { assets, dslQuery, assetTypeID } = searchResults;
            const dataArray = Array.isArray(assets) ? assets : [assets];
            
            // Set the assetTypeID to fetch the corresponding fields
            if (assetTypeID) {
                setAssetTypeID(assetTypeID);
            }
            
            // Process the data using the utility function
            const transformedData = processAssetData(dataArray, searchResults.assetTypeName);
            
            setRawData(transformedData);
            setDslQuery(dslQuery);
            
            form.reset({ query: formData.query });
        } catch (error: any) {
            console.error("Failed to execute query:", error);
            
            if (error.dslQuery) {
                setDslQuery(error.dslQuery);
            }
            
            let errorMessage: string;
            if (error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else {
                errorMessage = "An unknown error occurred while searching";
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            form.handleSubmit(onSubmit)();
        }
    };

    const exportToCSV = () => {
        if (rawData.length === 0) return;

        // Get the table handler's state for visible columns and date filters
        const tableHandler = document.querySelector('[data-testid="asset-table-handler"]');
        const minimizedColumns = JSON.parse(tableHandler?.getAttribute('data-minimized-columns') || '{}');
        const minimizedDateColumns = JSON.parse(tableHandler?.getAttribute('data-minimized-date-columns') || '{}');
        const dateRanges = JSON.parse(tableHandler?.getAttribute('data-date-ranges') || '{}');

        // Always include these columns
        const requiredColumns = ['assetID', 'assetTypeName'];
        
        // Get visible field columns and their dates
        const visibleColumns = fields
            .filter(field => !minimizedColumns[field.fieldName])
            .flatMap(field => {
                const columns = [field.fieldName];
                // Only include date column if it's visible
                if (!minimizedDateColumns[field.fieldName]) {
                    columns.push(`${field.fieldName}_date`);
                }
                return columns;
            });

        // Combine all columns
        const columns = [...requiredColumns, ...visibleColumns];

        // Filter data based on date ranges
        const filteredData = rawData.filter(asset => {
            return fields.every(field => {
                if (minimizedColumns[field.fieldName]) return true;
                const fieldValue = asset.fieldValues[field.fieldName];
                if (!fieldValue?.date) return true;
                
                const range = dateRanges[field.fieldName];
                if (!range) return true;

                const dateObj = new Date(fieldValue.date);
                if (range.startDate && dateObj < new Date(range.startDate)) return false;
                if (range.endDate && dateObj > new Date(range.endDate)) return false;
                return true;
            });
        });

        // Build CSV header
        const csvHeader = columns.join(",") + "\n";

        // Build CSV rows
        const csvRows = filteredData.map(item => {
            return columns.map(col => {
                if (col === 'assetID') {
                    return `"${item.assetID}"`;
                } else if (col === 'assetTypeName') {
                    return `"${item.assetTypeName}"`;
                } else if (col.endsWith('_date')) {
                    // Handle date columns
                    const fieldName = col.replace('_date', '');
                    const fieldValue = item.fieldValues[fieldName];
                    return `"${fieldValue?.date ? formatDateForDisplay(fieldValue.date) : ''}"`;
                } else if (item.fieldValues && col in item.fieldValues) {
                    const fieldValue = item.fieldValues[col];
                    const value = fieldValue.value;
                    // Format boolean values
                    if (fieldValue.type === 'bool') {
                        return `"${value ? 'Yes' : 'No'}"`;
                    }
                    return `"${value ?? ''}"`;
                } else {
                    return '""';
                }
            }).join(",");
        }).join("\n");

        // Download
        const csvContent = "data:text/csv;charset=utf-8," + csvHeader + csvRows;
        const encodedUri = encodeURI(csvContent);

        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center gap-2">
                <CardTitle>Search Data</CardTitle>
                <HelpIcon 
                    tooltipText="Use either the AI or DSL search to find the data you are looking for. Click to learn more!"
                    helpPath="/helpSearchingData"
                    size="md"
                    tooltipPosition="right"
                />
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
                        <div className="flex items-center space-x-2 mb-4">
                            <CustomSwitch
                                id="ai-mode"
                                checked={useAI}
                                onChange={setUseAI}
                                label={useAI ? "Using AI Search" : "Using DSL Search"}
                            />
                            <HelpIcon 
                                tooltipText="We recommend using the AI search until you get the hang of the DSL search. Click to learn more!"
                                helpPath="/helpSearchingData"
                                size="md"
                                tooltipPosition="right"
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="query"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative w-full flex gap-2">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                                <Input 
                                                    placeholder="What subcategory and information are you looking for?" 
                                                    className="pl-10 w-full" 
                                                    {...field} 
                                                    onKeyDown={handleKeyDown}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                                            >
                                                Search
                                            </button>
                                            {rawData.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={exportToCSV}
                                                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors flex items-center gap-2"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    Export CSV
                                                </button>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </form>
                </Form>

                {/* DSL Query Display */}
                {dslQuery && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mt-4">
                        <p className="font-bold">Generated DSL Query:</p>
                        <p className="font-mono text-sm mt-1">
                            {typeof dslQuery === 'string' ? dslQuery : dslQuery.dslQuery}
                        </p>
                    </div>
                )}

                {/* Loading and error states */}
                {loading && <div className="text-center mt-4">Loading...</div>}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4" role="alert">
                        <div className="flex">
                            <div className="py-1">
                                <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results Display */}
                {rawData.length > 0 && (
                    <div className="mt-4 overflow-x-auto" style={{ maxWidth: "90vw" }}>
                        <AssetTableHandler
                            fields={fields}
                            assetData={rawData}
                            selectedItem={selectedItem}
                            showActions={false}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
