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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { addField } from "../api/field";
import { fetchCategories } from "@/api/categories";
import { fetchAssetType } from "../api/assettype";
import { fetchField } from "../api/field";
import { logUserAction, useCurrentUser } from "@/utils/loggingUtils";
import { HelpIcon } from "./HelpIcon";
// normalizing data for stoage and display
import { isConflictingField, doesFieldExist, getExistingFieldUnits, hasDuplicateEnumOptions, hasConflictingEnumOptions } from "@/utils/duplicateChecks";
import { normalizeStringDisplay, normalizeStringStorage } from "@/utils/normalizeData";

// Define the schema with correct field names
const formSchema = z.object({
    FieldName: z.string().min(2, { message: "Name must have at least 2 charactors" }).max(50), 
    AssetType: z.string().min(2, { message: "Must Select from the dropdown" }).max(50),
    Units: z.string(), 
    FieldType: z.enum(["Double", "String", "Boolean", "Enum"], {
        required_error: "You must select a field type",
    }),
    EnumOptions: z.array(z.string()).optional(),
    ApplyToAllInCategory: z.boolean().optional(),
});

export function AddFieldForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            AssetType: "",
            FieldName: "", 
            Units: "",
            ApplyToAllInCategory: false,
            EnumOptions: [],
        },
    });

    //state for category popover
    const [categories, setCategories] = useState<any[]>([]);
    const [categorySearch, setCategorySearch] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedCategoryName, setSelectedCategoryName] = useState<string>("Select Category");
    const [categoryPopoverOpen, setCategoryPopoverOpen] = useState<boolean>(false);

    // States for asset types popover
    const [assetTypes, setAssetTypes] = useState<any[]>([]);
    const [assetTypeSearch, setAssetTypeSearch] = useState<string>("");
    const [assetTypePopoverOpen, setAssetTypePopoverOpen] = useState<boolean>(false);
    const [selectedAssetTypeName, setSelectedAssetTypeName] = useState<string>("Select Group");
    const [selectedAssetTypeID, setSelectedAssetTypeID] = useState<number | null>(null);

    // States for field type popover
    const [fieldTypePopoverOpen, setFieldTypePopoverOpen] = useState<boolean>(false);
    const [selectedFieldType, setSelectedFieldType] = useState<string>("");
    // state for checking if the entry in a duplicate
    const [fields, setFields] = useState<any[]>([]);
    const [statusMessage, setStatusMessage] = useState<null | { type: "success" | "error"; text: string }>(null);
    const currentUser = useCurrentUser();

    // Field types (hardcoded)
    const fieldTypes = [
        { value: "Double", label: "Number" },
        { value: "String", label: "Text" },
        { value: "Boolean", label: "True/False" },
        { value: "Enum", label: "Dropdown" }
    ];

    // Add state for new option input
    const [newOption, setNewOption] = useState("");

    // Function to add a new option
    const addOption = () => {
        if (newOption.trim()) {
            const currentOptions = form.getValues("EnumOptions") || [];
            form.setValue("EnumOptions", [...currentOptions, normalizeStringStorage(newOption)]);
            setNewOption(""); // Clear the input
        }
    };

    // Function to remove an option
    const removeOption = (index: number) => {
        const currentOptions = form.getValues("EnumOptions") || [];
        form.setValue("EnumOptions", currentOptions.filter((_, i) => i !== index));
    };


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
      
    useEffect(() => {
        const getAssetTypes = async () => {
            if (!selectedCategory) {
                setAssetTypes([]);
                return;
            }
            try {
                const data = await fetchAssetType();
                const filtered = data.filter(item => item.categoryID === Number(selectedCategory));
                setAssetTypes(filtered);
            } catch (error) {
                console.error("Error fetching asset types:", error);
            }
        };
        getAssetTypes();
    }, [selectedCategory]);

    // Fetch asset types for dropdown
    useEffect(() => {
        const getFields = async () => {
            try {
                const data = await fetchField();
                setFields(data);
            } catch (error) {
                console.error("Error fetching Groups:", error);
            }
        };
        getFields();
    }, [selectedAssetTypeName]);


    const filteredCategories = categories.filter(cat => 
        cat.categoryName.toLowerCase().includes(categorySearch.toLowerCase())
    );
      
    // Filter asset types based on search input
    const filteredAssetTypes = assetTypes.filter(type => 
        type.name.toLowerCase().includes(assetTypeSearch.toLowerCase())
    );

    // Auto-dismiss messages after 2 seconds
    useEffect(() => {
        if (statusMessage) {
            const timer = setTimeout(() => setStatusMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [statusMessage]);

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        // Validate enum options if field type is Enum
        if (data.FieldType === 'Enum') {
            if (!data.EnumOptions || data.EnumOptions.length === 0) {
                setStatusMessage({ type: "error", text: "Please provide at least one option for the dropdown field" });
                return;
            }
        }

        if (data.ApplyToAllInCategory) {
            if (!selectedCategory) {
                setStatusMessage({ type: "error", text: "No category selected." });
                return;
            }

            // Check for duplicate enum options if field type is Enum
            if (data.FieldType === 'Enum' && data.EnumOptions && hasDuplicateEnumOptions(data.EnumOptions)) {
                setStatusMessage({ type: "error", text: "Duplicate options are not allowed in the dropdown field." });
                return;
            }
    
            const assetTypesInCategory = assetTypes;
    
            const conflictingField = isConflictingField(
                data.FieldName,
                data.FieldType,
                fields,
                assetTypesInCategory
            );
    
            if (conflictingField) {
                setStatusMessage({
                    type: "error",
                    text: `Field "${normalizeStringDisplay(data.FieldName)}" already exists in group "${normalizeStringDisplay(conflictingField.fieldName)}" with a different type.`,
                });
                return;
            }

            // Check for existing fields with different enum options
            if (data.FieldType === 'Enum') {
                const conflictingAssetTypeID = hasConflictingEnumOptions(
                    data.FieldName,
                    data.EnumOptions || [],
                    fields,
                    assetTypesInCategory
                );

                if (conflictingAssetTypeID) {
                    const conflictingAssetType = assetTypesInCategory.find(
                        type => type.assetTypeID === conflictingAssetTypeID
                    );
                    setStatusMessage({
                        type: "error",
                        text: `Field "${normalizeStringDisplay(data.FieldName)}" already exists in group "${normalizeStringDisplay(conflictingAssetType?.name || '')}" with different options.`,
                    });
                    return;
                }
            }
    
            const existingUnits = getExistingFieldUnits(
                data.FieldName,
                fields,
                assetTypesInCategory
            );
    
            let addedCount = 0;
            let skippedCount = 0;
    
            for (const type of assetTypesInCategory) {
                const exists = doesFieldExist(data.FieldName, fields, type.assetTypeID);
    
                if (!exists) {
                    skippedCount++;
                    continue;
                }
    
                try {
                    await addField(type.name, exists, data.FieldType, existingUnits ?? data.Units, data.EnumOptions);
                    addedCount++;
                } catch (error) {
                    console.error(`Failed to add field to ${type.name}:`, error);
                }
            }
    
            setStatusMessage({
                type: "success",
                text: `Field added to ${addedCount} group(s). ${skippedCount > 0 ? `${skippedCount} skipped (already existed).` : ""}`,
            });
            
            // Log the change
            try {
                await logUserAction(
                    "Add Field",
                    `Added field "${data.FieldName}" to all groups in category "${selectedCategoryName}"`,
                    currentUser
                );
            } catch (logError) {
                console.error("Error logging change:", logError);
                // Don't throw the error to avoid disrupting the main flow
            }
        } else {
            // returns false if the field exists, otherwise returns the normalized field name
            const exists = doesFieldExist(data.FieldName, fields, selectedAssetTypeID);
            if (!exists) {
                setStatusMessage({ type: "error", text: "Field already exists in this group." });
                return;
            }

            // Check for duplicate enum options if field type is Enum
            if (data.FieldType === 'Enum' && data.EnumOptions && hasDuplicateEnumOptions(data.EnumOptions)) {
                setStatusMessage({ type: "error", text: "Duplicate options are not allowed in the dropdown field." });
                return;
            }
    
            try {
                await addField(data.AssetType, exists, data.FieldType, data.Units, data.EnumOptions);
                setStatusMessage({ type: "success", text: "Field added successfully!" });
                
                // Log the change
                try {
                    await logUserAction(
                        "Add Field",
                        `Added field "${data.FieldName}" to group "${data.AssetType}"`,
                        currentUser
                    );
                } catch (logError) {
                    console.error("Error logging change:", logError);
                    // Don't throw the error to avoid disrupting the main flow
                }
            } catch (error) {
                console.error("Failed to add field:", error);
                setStatusMessage({ type: "error", text: "Error adding field." });
                return;
            }
        }
    
        form.reset();
        setSelectedAssetTypeName("Select Group");
        setSelectedFieldType("");
    };    

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-2">
                <CardTitle>Add Field</CardTitle>
                <HelpIcon 
                    tooltipText="Fields are the things that you want to track about an asset. Click to learn more!"
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

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Select Category</label>
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
                                        setSelectedCategory(category.categoryID);
                                        setSelectedCategoryName(category.categoryName);
                                        setCategoryPopoverOpen(false);
                                        setSelectedAssetTypeID(null); // Reset asset type
                                        setSelectedAssetTypeName("Select Group"); // Reset asset type
                                        setSelectedAssetTypeName("Select Group");
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
                        </div>

                        {/* Asset Type Dropdown */}
                        <FormField
                            control={form.control}
                            name="AssetType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Group</FormLabel>
                                    <Popover open={assetTypePopoverOpen} onOpenChange={setAssetTypePopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between">
                                                {normalizeStringDisplay(selectedAssetTypeName)}
                                                <ChevronDown className="h-4 w-4 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-72 p-0">
                                            <div className="p-2 border-b">
                                                <div className="flex items-center gap-2 px-2 py-1 border rounded-md">
                                                    <Search className="h-4 w-4 opacity-50" />
                                                    <Input 
                                                        placeholder="Search Groups..."
                                                        className="border-0 p-0 focus-visible:ring-0 h-8"
                                                        value={assetTypeSearch}
                                                        onChange={(e) => setAssetTypeSearch(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto py-1">
                                                {filteredAssetTypes.length > 0 ? (
                                                    filteredAssetTypes.map((type, idx) => (
                                                        <div 
                                                            key={idx} 
                                                            className="px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
                                                            onClick={() => {
                                                                setSelectedAssetTypeName(type.name);
                                                                setSelectedAssetTypeID(type.assetTypeID)
                                                                field.onChange(type.name);
                                                                setAssetTypePopoverOpen(false);
                                                            }}
                                                        >
                                                            {normalizeStringDisplay(type.name)}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-2 py-2 text-sm text-gray-500 text-center">
                                                        No Groups found
                                                    </div>
                                                )}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Field Name Input */}
                        <FormField
                            control={form.control}
                            name="FieldName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name of Field</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Weight" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Field Units Input */}
                        <FormField
                            control={form.control}
                            name="Units"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Units</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Optional" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Field Type Dropdown with Popover */}
                        <FormField
                            control={form.control}
                            name="FieldType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Field Type</FormLabel>
                                    <Popover open={fieldTypePopoverOpen} onOpenChange={setFieldTypePopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between">
                                                {selectedFieldType || "Select Field Type"}
                                                <ChevronDown className="h-4 w-4 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-72 p-0">
                                            <div className="max-h-60 overflow-y-auto py-1">
                                                {fieldTypes.map((type, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        className="px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedFieldType(type.label);
                                                            field.onChange(type.value);
                                                            setFieldTypePopoverOpen(false);
                                                        }}
                                                    >
                                                        {type.label}
                                                    </div>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                        <FormMessage />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Note: Field type cannot be changed after creation
                                        </p>
                                    </Popover>
                                </FormItem>
                            )}
                        />

                        {/* Enum Options Input - Only show when Enum type is selected */}
                        {form.watch("FieldType") === "Enum" && (
                            <FormField
                                control={form.control}
                                name="EnumOptions"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="space-y-2">
                                            {/* Input for new option */}
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Enter an option"
                                                    value={newOption}
                                                    onChange={(e) => setNewOption(e.target.value)}
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={addOption}
                                                    className="px-3"
                                                >
                                                    +
                                                </Button>
                                            </div>

                                            {/* List of current options */}
                                            <div className="space-y-2">
                                                {field.value?.map((option, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <Input
                                                            value={normalizeStringDisplay(option)}
                                                            readOnly
                                                            className="flex-1"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => removeOption(index)}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            click + to add an option
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                        control={form.control}
                        name="ApplyToAllInCategory"
                        render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                            <FormControl>
                                <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={field.value}
                                onChange={field.onChange}
                                />
                            </FormControl>
                            <FormLabel className="!m-2 text-sm font-normal">
                                Add field to all groups in this category
                            </FormLabel>
                            </FormItem>
                        )}
                        />


                        {/* Submit Button */}
                        <Button type="submit" className="bg-green-500 hover:bg-green-700 text-white w-full">
                            Add Field
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};