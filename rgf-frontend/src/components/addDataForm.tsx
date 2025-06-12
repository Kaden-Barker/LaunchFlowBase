import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchCategories } from "@/api/categories";
import { fetchAssetType } from "@/api/assettype";
import { fetchField } from "@/api/field"; 
import { addAssetWithEntries, createEntryInput } from "@/api/asset";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Search } from "lucide-react";
import { fetchAssetsByType } from "@/api/generalSearch";
import { logUserAction, useCurrentUser } from "@/utils/loggingUtils";
import { HelpIcon } from "./HelpIcon";
// normalizing data for display
import { normalizeStringDisplay } from "@/utils/normalizeData";
import { AssetTableHandler, processAssetData } from "./handlers/AssetTableHandler";

interface FieldValue {
  value: any;
  type: string;
  entryID: number;
  date?: string;
}

interface AssetData {
  assetID: number;
  assetTypeName: string;
  fieldValues: Record<string, FieldValue>;
}

export function AddDataForm() {
  // storing the state of the dropdowns and field values
  const [categories, setCategories] = useState<any[]>([]);
  const [assetTypes, setAssetTypes] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("Select Category");
  const [selectedAssetType, setSelectedAssetType] = useState<string>("");
  const [selectedAssetTypeName, setSelectedAssetTypeName] = useState<string>("Select Group");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [entryDate, setEntryDate] = useState<string>("");
  
  // Search states
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [assetTypeSearch, setAssetTypeSearch] = useState<string>("");
  
  // Popover open states
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState<boolean>(false);
  const [assetTypePopoverOpen, setAssetTypePopoverOpen] = useState<boolean>(false);

  const [assetData, setAssetData] = useState<AssetData[]>([]);
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

  // Everytime the category selected changes, fetch asset types
  useEffect(() => {
    const getAssetTypes = async () => {
      if (!selectedCategory) {
        setAssetTypes([]);
        return;
      }
      try {
        const data = await fetchAssetType(Number(selectedCategory));
        setAssetTypes(data);
      } catch (error) {
        console.error("Error fetching asset types:", error);
      }
    };
    getAssetTypes();
  }, [selectedCategory]);

  // Everytime the asset type selected changes, fetch fields
  useEffect(() => {
    const getFields = async () => {
      if (!selectedAssetType) {
        setFields([]);
        return;
      }
      try {
        const data = await fetchField(Number(selectedAssetType));
        setFields(data);
      } catch (error) {
        console.error("Error fetching fields:", error);
      }
    };
    getFields();
  }, [selectedAssetType]);

  // When the form is submitted, this function is called to update the field values for the return
  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  // Filter categories based on search input
  const filteredCategories = categories.filter(category => 
    category.categoryName.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Filter asset types based on search input
  const filteredAssetTypes = assetTypes.filter(type => 
    type.name.toLowerCase().includes(assetTypeSearch.toLowerCase())
  );

  // Function to process and update asset data
  const processAndUpdateAssetData = async () => {
    if (!selectedAssetType) {
      setAssetData([]);
      return;
    }
    try {
      const assets = await fetchAssetsByType(Number(selectedAssetType));
      
      // Process the assets using the utility function
      const processedAssets = processAssetData(assets, selectedAssetTypeName);

      // Sort by date and take last 10
      const sortedAssets = processedAssets.sort((a, b) => {
        // Get all dates from all fields
        const aDates = Object.values(a.fieldValues).map(field => field.date || '');
        const bDates = Object.values(b.fieldValues).map(field => field.date || '');
        
        // Find the most recent date for each asset
        const aLatestDate = aDates.reduce((latest, current) => 
          latest > current ? latest : current, '');
        const bLatestDate = bDates.reduce((latest, current) => 
          latest > current ? latest : current, '');
          
        return new Date(aLatestDate).getTime() - new Date(bLatestDate).getTime();
      }).slice(-10).reverse();

      setAssetData(sortedAssets);
    } catch (error) {
      console.error("Error fetching recent entries:", error);
    }
  };


  // On submit log results and call api to add data to the database
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Get the selected asset type name
      const selectedAssetTypeObj = assetTypes.find(type => type.assetTypeID === Number(selectedAssetType));
      
      if (!selectedAssetTypeObj) {
        throw new Error("Selected asset type not found");
      }

      // Set any unset boolean fields to false
      const updatedFieldValues = { ...fieldValues };
      fields.forEach(field => {
        if (field.fieldType === 'Boolean' && !(field.fieldID in updatedFieldValues)) {
          updatedFieldValues[field.fieldID] = "false";
        }
      });

      // Create entries array from field values
      const entries = Object.entries(updatedFieldValues).map(([fieldID, value]) => {
        // Find the field to determine its type
        const field = fields.find(f => f.fieldID === Number(fieldID));
        
        // Convert value based on field type
        let convertedValue: string | number | boolean = value;
        if (field) {
          if (field.fieldType === 'Double') {
            convertedValue = Number(value);
          } else if (field.fieldType === 'Boolean') {
            convertedValue = value.toLowerCase() === 'true' || value === '1';
          }
        }
        
        return createEntryInput(Number(fieldID), convertedValue, entryDate || undefined);
      });

      if (entries.length === 0) {
        throw new Error('Please fill in at least one field');
      }

      // Call the API to create the asset with entries
      const response = await addAssetWithEntries(selectedAssetTypeObj.name, entries);
      console.log("Submitted Data:", response);
      setSuccess(true);

      // Log the change
      try {
        // Format field values for logging
        const formattedFieldValues = Object.entries(fieldValues).map(([fieldID, value]) => {
          const field = fields.find(f => f.fieldID === Number(fieldID));
          if (!field) return '';
          return `${field.fieldName}: ${value}`;
        }).filter(Boolean).join(', ');

        await logUserAction(
          "Insert Data",
          `Added new ${selectedAssetTypeName} with values: ${formattedFieldValues}`,
          currentUser
        );
      } catch (logError) {
        console.error("Error logging change:", logError);
        // Don't throw the error to avoid disrupting the main flow
      }

      // Clear the field values after submission
      setFieldValues({});
      
      // Refresh the asset data immediately after successful submission
      await processAndUpdateAssetData();
    } catch (err: any) {
      console.error("Error submitting form:", err);
      setError(err.message || "Failed to create asset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch asset data when asset type changes
  useEffect(() => {
    processAndUpdateAssetData();
  }, [selectedAssetType]);

  // Clear success and error messages after 2 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(false);
        setError(null);
      }, 2000);

      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [success, error]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Card - Current Form */}
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center gap-2">
            <CardTitle>Add Data</CardTitle>
            <HelpIcon 
                tooltipText="Fill out the form to determine what asset to add data to. Click to learn more!"
                helpPath="/helpInsertingData"
                size="md"
            />
          </CardHeader>
          <CardContent>
            {/* Success message */}
            {success && (
              <div className="mb-4 p-2 bg-green-100 text-green-800 rounded-md">
                Asset created successfully!
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-800 rounded-md">
                {error}
              </div>
            )}
            
            {/* Popover for category selection */}
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

            {/* Popover for asset type selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium">Select Group</label>
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
                        placeholder="Search groups..."
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
                            setSelectedAssetType(type.assetTypeID);
                            setSelectedAssetTypeName(type.name);
                            setAssetTypePopoverOpen(false);
                          }}
                        >
                          {normalizeStringDisplay(type.name)}
                        </div>
                      ))
                    ) : (
                      <div className="px-2 py-2 text-sm text-gray-500 text-center">
                        No groups found
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Fields for the selected asset type */}
            {selectedAssetType && (
              <div className="mb-4">
                {/* Date input field */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Entry Date (Optional)</label>
                  <Input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    If no date is selected, today's date will be used
                  </p>
                </div>

                {fields.length > 0 ? (
                  <>
                    <div className="flex space-x-8 mb-2">
                      <span className="text-sm font-medium w-1/2">Field</span>
                      <span className="text-sm font-medium w-1/2">Value</span>
                    </div>

                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <span className="text-sm font-medium w-1/2">{normalizeStringDisplay(field.fieldName)}</span>

                          {field.fieldType === 'Double' ? (
                            <Input
                              type="number"
                              placeholder="Enter a number"
                              className="w-1/2"
                              value={fieldValues[field.fieldID] || ""}
                              onChange={(e) => handleFieldChange(field.fieldID, e.target.value)}
                            />
                          ) : field.fieldType === 'Boolean' ? (
                            <div className="w-1/2 flex items-center">
                              <input
                                type="checkbox"
                                id={`field-${field.fieldID}`}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={fieldValues[field.fieldID] === "true"}
                                onChange={(e) => handleFieldChange(field.fieldID, e.target.checked ? "true" : "false")}
                              />
                              <label htmlFor={`field-${field.fieldID}`} className="ml-2 text-sm text-gray-700">
                                {fieldValues[field.fieldID] === "true" ? "True" : "False"}
                              </label>
                            </div>
                          ) : field.fieldType === 'Enum' ? (
                            <div className="w-1/2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-between">
                                    {fieldValues[field.fieldID] ? normalizeStringDisplay(fieldValues[field.fieldID]) : "Select an option"}
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0">
                                  <div className="max-h-60 overflow-y-auto py-1">
                                    {field.enumOptions && field.enumOptions.length > 0 ? (
                                      field.enumOptions.map((option: string, idx: number) => (
                                        <div
                                          key={idx}
                                          className="px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
                                          onClick={() => handleFieldChange(field.fieldID, option)}
                                        >
                                          {normalizeStringDisplay(option)}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="px-2 py-2 text-sm text-gray-500 text-center">
                                        No options available
                                      </div>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          ) : (
                            <Input
                              type="text"
                              placeholder="Enter text"
                              className="w-1/2"
                              value={fieldValues[field.fieldID] || ""}
                              onChange={(e) => handleFieldChange(field.fieldID, e.target.value)}
                            />
                          )}
                          <span className="text-sm font-medium w-1/2">{field.units?.toLowerCase()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center text-gray-600 bg-gray-100 rounded-md">
                    There are no fields associated with this group.
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={!selectedCategory || !selectedAssetType || Object.keys(fieldValues).length === 0 || loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </CardContent>
        </Card>

        {/* Right Card - Showing latest Entries */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>{selectedAssetType ? `Latest Entries for "${normalizeStringDisplay(selectedAssetTypeName)}" Group` : "Recent Entries"}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAssetType && fields.length > 0 && assetData.length > 0 ? (
              <AssetTableHandler
                fields={fields}
                assetData={assetData}
                selectedItem={null}
                showActions={false}
              />
            ) : (
              <div className="py-4 text-center text-gray-600 bg-gray-100 rounded-md">
                {selectedAssetType ? "No entries found for this group." : "Select a group to view recent entries."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}