import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormLabel,
    FormItem,
    FormMessage,
    FormField,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Search } from "lucide-react";
import { HelpIcon } from "./HelpIcon";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { fetchCategories } from "../api/categories";
import { fetchAssetType } from "../api/assettype";
import { addAssetType } from "../api/assettype";
import { logUserAction, useCurrentUser } from "@/utils/loggingUtils";

// for normalizing data in storage and display
import { isDuplicateAssetType } from "../utils/duplicateChecks";
import { normalizeStringDisplay } from "@/utils/normalizeData";

// Define the schema with correct field names
const formSchema = z.object({
    TypeName: z.string().min(2, { message: "Group must have at least 2 charactors" }).max(50), 
    Category: z.string().min(2, { message: "Category must be selected from the Dropdown" }).max(50), 
});

export function AddAssetTypeForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            TypeName: "", 
            Category: "", 
        },
    });

    // States for categories popover
    const [categories, setCategories] = useState<any[]>([]);
    const [categorySearch, setCategorySearch] = useState<string>("");
    const [categoryPopoverOpen, setCategoryPopoverOpen] = useState<boolean>(false);
    const [selectedCategoryName, setSelectedCategoryName] = useState<string>("Select Category");
    const [selectedCategoryID, setSelectedCategoryID] = useState<number | null>(null);
    const [assetTypes, setAssetTypes] = useState<any[]>([]);
    const [statusMessage, setStatusMessage] = useState<null | { type: "success" | "error"; text: string }>(null);
    const currentUser = useCurrentUser();

    // Fetch categories for dropdown
    useEffect(() => {
        const getCategories = async () => {
            try {
                const data = await fetchCategories();
                setCategories(data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        getCategories();
    }, []);


    const getAssetTypes = async () => {
        try {
        const data = await fetchAssetType();
        setAssetTypes(data);
        } catch (error) {
        console.error("Error fetching asset types:", error);
        }
    };
    // Fetch asset types on mount
    useEffect(() => {
        getAssetTypes();
        }, []);
    
    // Auto-dismiss messages after 2 seconds
    useEffect(() => {
        if (statusMessage) {
            const timer = setTimeout(() => setStatusMessage(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [statusMessage]);

    // Filter categories based on search input
    const filteredCategories = categories.filter(category => 
        category.categoryName.toLowerCase().includes(categorySearch.toLowerCase())
    );

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        // checks for duplicates and normalizes the entry
        const normalizedAssetType = isDuplicateAssetType(data.TypeName, selectedCategoryID, assetTypes,);

        if (!normalizedAssetType) {
            setStatusMessage({ type: "error", text: "Group already exists." });
            return;
        }
    
        try {
            const newAssetType = await addAssetType(data.Category, normalizedAssetType);
            console.log("AssetType added:", newAssetType);
            form.reset(); // Reset the form after successful submission
            setStatusMessage({ type: "success", text: "Group added successfully!" });
            await getAssetTypes();            
            setSelectedCategoryName("Select Category");
            setSelectedCategoryID(null);
            
            // Log the change
            try {
                await logUserAction(
                    "Add Asset Type",
                    `Added new asset type "${normalizedAssetType}" to category "${data.Category}"`,
                    currentUser
                );
            } catch (logError) {
                console.error("Error logging change:", logError);
                // Don't throw the error to avoid disrupting the main flow
            }
        } catch (error) {
            console.error("Failed to add assetType:", error);
            setStatusMessage({ type: "error", text: "Failed to add group." });
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-2">
                <CardTitle>Add Group</CardTitle>
                <HelpIcon 
                    tooltipText="Groups are subdivisions within categories that provide more specific organization. Click to learn more!"
                    helpPath="/helpEditingTables"
                    size="md"
                />
            </CardHeader>
            <CardContent>
                {statusMessage && (
                    <div
                        className={`text-center text-sm font-medium p-2 rounded ${
                        statusMessage.type === "success"
                            ? "text-green-600 bg-green-100"
                            : "text-red-600 bg-red-100"
                        }`}
                    >
                        {statusMessage.text}
                    </div>
                )}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Category Dropdown */}
                        <FormField
                            control={form.control}
                            name="Category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between">
                                                {normalizeStringDisplay(selectedCategoryName)}
                                                <ChevronDown className="h-4 w-4 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-72 p-0">
                                            <div className="p-2 border-b">
                                                <div className="flex items-center gap-2 px-2 py-1 border rounded-md">
                                                    <Search className="h-4 w-4 opacity-50" />
                                                    <Input 
                                                        placeholder="Search categories..."
                                                        className="border-0 p-0 focus-visible:ring-0 h-8"
                                                        value={categorySearch}
                                                        onChange={(e) => setCategorySearch(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto py-1">
                                                {filteredCategories.length > 0 ? (
                                                    filteredCategories.map((category, idx) => (
                                                        <div 
                                                            key={idx} 
                                                            className="px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
                                                            onClick={() => {
                                                                setSelectedCategoryName(category.categoryName);
                                                                setSelectedCategoryID(category.categoryID);
                                                                field.onChange(category.categoryName);
                                                                setCategoryPopoverOpen(false);
                                                            }}
                                                        >
                                                            {normalizeStringDisplay(category.categoryName)}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-2 py-2 text-sm text-gray-500 text-center">
                                                        No categories found
                                                    </div>
                                                )}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* TypeName Input */}
                        <FormField
                            control={form.control}
                            name="TypeName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name of Group</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Cattle" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Submit Button */}
                        <Button type="submit" className="bg-green-500 hover:bg-green-700 text-white w-full">
                            Add Group
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};
