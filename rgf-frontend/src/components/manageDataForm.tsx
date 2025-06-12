import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search, Pencil, Trash2 } from "lucide-react";

import { fetchCategories } from "@/api/categories";
import { fetchAssetType } from "@/api/assettype";
import { fetchField } from "@/api/field";
import { fetchAssetsByType } from "@/api/generalSearch";
import { DeleteHandler } from "./handlers/DeleteHandler";
import { UpdateHandler } from "./handlers/UpdateHandler";
import { AssetTableHandler, processAssetData } from "./handlers/AssetTableHandler";
import { normalizeStringDisplay } from "@/utils/normalizeData";
import { HelpIcon } from "./HelpIcon";
import { useUser, hasUpdatePermission, hasDeletePermission } from "./handlers/UserContext";
import { PermissionDeniedPopup } from "./permissions/PermissionDeniedPopup";

const itemTypes = [
  { label: "Category", value: "category" },
  { label: "Group", value: "group" },
  { label: "Field", value: "field" },
  { label: "Asset", value: "asset" },
];

// Reusable Category Dropdown Component
interface CategoryDropdownProps {
  selectedCategoryName: string | null;
  setSelectedCategoryName: (name: string) => void;
  setSelectedCategoryID: (id: number) => void;
  categories: { categoryID: number; categoryName: string }[];
  categorySearch: string;
  setCategorySearch: (search: string) => void;
  categoryPopoverOpen: boolean;
  setCategoryPopoverOpen: (open: boolean) => void;
}

function CategoryDropdown({
  selectedCategoryName,
  setSelectedCategoryName,
  setSelectedCategoryID,
  categories,
  categorySearch,
  setCategorySearch,
  categoryPopoverOpen,
  setCategoryPopoverOpen,
}: CategoryDropdownProps) {
  const filteredCategories = categories.filter((category) =>
    category.categoryName.toLowerCase().includes((categorySearch || "").toLowerCase())
  );

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">Select Category</label>
      <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selectedCategoryName ? normalizeStringDisplay(selectedCategoryName) : "Select Category"}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0">
          <div className="p-2 border-b">
            <div className="flex items-center gap-2 px-2 py-1 border rounded-md">
              <Search className="h-4 w-4 opacity-50" />
              <Input
                placeholder="Search Categories..."
                className="border-0 p-0 focus-visible:ring-0 h-8"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
              />
            </div>
          </div>
          <div className="py-2">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <div key={category.categoryID} className="px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
                  onClick={() => { 
                    setSelectedCategoryName(category.categoryName); 
                    setSelectedCategoryID(category.categoryID); 
                    setCategoryPopoverOpen(false);
                  }}>
                  {normalizeStringDisplay(category.categoryName)}
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-gray-600 bg-gray-100 rounded-md">
                There are no categories.
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Reusable Group Dropdown Component
interface GroupDropdownProps {
  selectedAssetTypeName: string | null;
  setSelectedAssetTypeName: (name: string) => void;
  setSelectedAssetTypeID: (id: number) => void;
  assetTypes: { assetTypeID: number; categoryID: number; name: string }[];
  assetTypeSearch: string;
  setAssetTypeSearch: (search: string) => void;
  assetTypePopoverOpen: boolean;
  setAssetTypePopoverOpen: (open: boolean) => void;
}

function GroupDropdown({
  selectedAssetTypeName,
  setSelectedAssetTypeName,
  setSelectedAssetTypeID,
  assetTypes,
  assetTypeSearch,
  setAssetTypeSearch,
  assetTypePopoverOpen,
  setAssetTypePopoverOpen,
}: GroupDropdownProps) {
  const filteredAssetTypes = assetTypes.filter((assetType) =>
    assetType.name.toLowerCase().includes((assetTypeSearch || "").toLowerCase())
  );

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">Select Group</label>
      <Popover open={assetTypePopoverOpen} onOpenChange={setAssetTypePopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selectedAssetTypeName ? normalizeStringDisplay(selectedAssetTypeName) : "Select Group"}
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
          <div className="py-2">
            {filteredAssetTypes.length > 0 ? (
              filteredAssetTypes.map((assetType) => (
                <div key={assetType.assetTypeID} className="px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
                  onClick={() => { 
                    setSelectedAssetTypeName(assetType.name); 
                    setSelectedAssetTypeID(assetType.assetTypeID); 
                    setAssetTypePopoverOpen(false);
                  }}>
                  {normalizeStringDisplay(assetType.name)}
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-gray-600 bg-gray-100 rounded-md">
                There are no groups associated with this category.
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface Field {
  fieldID: number;
  fieldName: string;
  fieldType: string;
  units?: string;
}

export function UpdateDataForm() {
  // state for choosing what type of thing you're updating
  const [selectedItemType, setSelectedItemType] = useState<string | null>(null);
  //states for all and the selected category
  const [selectedCategoryID, setSelectedCategoryID] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ categoryID: number; categoryName: string }[]>([]);
  // states for all and the selected assettype
  const [selectedAssetTypeID, setSelectedAssetTypeID] = useState<number | null>(null);
  const [selectedAssetTypeName, setSelectedAssetTypeName] = useState<string | null>(null);
  const [assetTypes, setAssetTypes] = useState<{ assetTypeID: number; categoryID: number; name: string }[]>([]);
  // states for all and the selected field
  const [fields, setFields] = useState<Field[]>([]);
  // success and error state
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // state for selected item in table
  const [selectedItem, setSelectedItem] = useState<any>(null);
  // state for asset data with field values
  const [assetData, setAssetData] = useState<any[]>([]);

  // Popover states
  const [itemTypePopoverOpen, setItemTypePopoverOpen] = useState<boolean>(false);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState<boolean>(false);
  const [assetTypePopoverOpen, setAssetTypePopoverOpen] = useState<boolean>(false);
  const [itemTypeSearch, setItemTypeSearch] = useState<string>("");
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [assetTypeSearch, setAssetTypeSearch] = useState<string>("");

  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);

  // Add new state for permission denied popup
  const [showPermissionDenied, setShowPermissionDenied] = useState(false);
  const { userPermissions, isEmergencyAccess } = useUser();

  // Filtered data for search functionality
  const filteredItemTypes = itemTypes.filter((item) =>
    item.label.toLowerCase().includes((itemTypeSearch || "").toLowerCase())
  );

  // hook for clearing the success or error
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(false);
        setError('');
      }, 2000);
  
      return () => clearTimeout(timer); // cleanup
    }
  }, [success, error]);

  // reset all selected dropdowns when a new itemType is chosen
  useEffect(() => {
    const resetAllSelected = async () => {
      setSelectedCategoryID(null);
      setSelectedCategoryName(null);
      setSelectedAssetTypeID(null);
      setSelectedAssetTypeName(null);
      setSelectedItem(null);
      setAssetData([]);
    };
    resetAllSelected();
  }, [selectedItemType])

  // Function to fetch categories
  const fetchCategoriesData = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to fetch categories");
    }
  };

  // Function to fetch asset types
  const fetchAssetTypesData = async () => {
    if (selectedCategoryID) {
      try {
        const data = await fetchAssetType(selectedCategoryID);
        setAssetTypes(data);
      } catch (error) {
        console.error("Error fetching asset types:", error);
        setError("Failed to fetch asset types");
      }
    }
  };

  // Function to fetch fields
  const fetchFieldsData = async () => {
    if (selectedAssetTypeID) {
      try {
        const allFields = await fetchField(selectedAssetTypeID);
        setFields(allFields);
      } catch (error) {
        console.error("Error fetching fields:", error);
        setError("Failed to fetch fields");
      }
    }
  };

  // Function to fetch asset details
  const fetchAssetDetails = async () => {
    if (selectedAssetTypeID) {
      try {
        // Get all assets with their entries for the selected asset type
        const assets = await fetchAssetsByType(selectedAssetTypeID);
        
        // Process the data using the utility function
        const assetDetails = processAssetData(assets, selectedAssetTypeName || '');

        setAssetData(assetDetails);
      } catch (error) {
        console.error("Error fetching asset details:", error);
        setError("Failed to fetch asset details");
      }
    }
  };

  // Function to initialize the data load
  const initializeData = async () => {
    await fetchCategoriesData();

    if (selectedCategoryID) {
      await fetchAssetTypesData();
      
      if (selectedAssetTypeID) {
        await fetchFieldsData();
        await fetchAssetDetails();
      }
    }
  };

  // Function to refresh data based on the selected item type
  const refreshData = async () => {
    // When we refresh, we need to fully re-initialize the data
    // This ensures all api calls are made with the proper parameters
    await initializeData();
  };

  // Fetch asset data when asset type is selected
  useEffect(() => {
    if (selectedAssetTypeID) {
      fetchAssetDetails();
    }
  }, [selectedAssetTypeID]);

  // Add this useEffect to fetch fields when asset type is selected
  useEffect(() => {
    if (selectedAssetTypeID) {
      fetchFieldsData();
    }
  }, [selectedAssetTypeID]);

  // Function to handle starting the edit process
  const handleStartEdit = (item: any) => {
    if (!hasUpdatePermission(userPermissions, isEmergencyAccess)) {
      setShowPermissionDenied(true);
      return;
    }
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  // Function to handle starting the delete process
  const handleStartDelete = (item: any) => {
    if (!hasDeletePermission(userPermissions, isEmergencyAccess)) {
      setShowPermissionDenied(true);
      return;
    }
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  // Update the useEffect hooks to use the new functions
  useEffect(() => {
    if (selectedItemType === "category") {
      fetchCategoriesData();
    }
  }, [selectedItemType]);

  useEffect(() => {
    if ((selectedItemType === "group" || selectedItemType === "field" || selectedItemType === "asset") && selectedCategoryID) {
      fetchAssetTypesData();
    }
  }, [selectedCategoryID, selectedItemType]);
  
  // Initialize data when component mounts
  useEffect(() => {
    initializeData();
    // We need to re-run this whenever the selected IDs change
    // This ensures proper filtering of data
  }, [selectedCategoryID, selectedAssetTypeID]);

  // Helper function to create a colgroup with dynamic widths
  const createColGroup = (numColumns: number) => {
    const cols = [];
    // First column is Actions with fixed width
    cols.push(<col key="actions" style={{ width: '115px' }} />);
    
    // Add remaining columns with auto width
    for (let i = 1; i < numColumns; i++) {
      cols.push(<col key={i} style={{ width: 'auto' }} />);
    }
    
    return <colgroup>{cols}</colgroup>;
  };

  // Common table styles
  const tableStyles = "w-full table-auto border-collapse border border-border";
  const cellStyles = "p-3 align-middle border border-border";
  const headerCellStyles = "p-3 text-left font-medium text-muted-foreground border border-border bg-muted sticky top-[-1px]";
  
  // Render the appropriate table based on the selected item type
  const renderTable = () => {
    if (!selectedItemType) return null;

    switch (selectedItemType) {
      case "category":
        return (
          <div className="mt-4">
            <div className="border border-border rounded-md overflow-hidden">
              <div className="max-h-[500px] overflow-auto scrollbar-thin">
                <table className={tableStyles + " table-fixed"}>
                  {createColGroup(2)}
                  <thead>
                    <tr>
                      <th className={headerCellStyles}>Actions</th>
                      <th className={headerCellStyles}>Category Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr 
                        key={category.categoryID}
                        className={selectedItem?.categoryID === category.categoryID ? "bg-muted" : ""}
                      >
                        <td className={cellStyles}>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartEdit(category)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleStartDelete(category)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                        <td className={cellStyles}>{normalizeStringDisplay(category.categoryName)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "group":
        return (
          <>
            <CategoryDropdown
              selectedCategoryName={selectedCategoryName}
              setSelectedCategoryName={setSelectedCategoryName}
              setSelectedCategoryID={setSelectedCategoryID}
              categories={categories}
              categorySearch={categorySearch}
              setCategorySearch={setCategorySearch}
              categoryPopoverOpen={categoryPopoverOpen}
              setCategoryPopoverOpen={setCategoryPopoverOpen}
            />
            {selectedCategoryID && (
              <div className="mt-4">
                <div className="border border-border rounded-md overflow-hidden">
                  <div className="max-h-[500px] overflow-auto scrollbar-thin">
                    <table className={tableStyles + " table-fixed"}>
                      {createColGroup(2)}
                      <thead>
                        <tr>
                          <th className={headerCellStyles}>Actions</th>
                          <th className={headerCellStyles}>Group Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assetTypes.map((assetType) => (
                          <tr 
                            key={assetType.assetTypeID}
                            className={selectedItem?.assetTypeID === assetType.assetTypeID ? "bg-muted" : ""}
                          >
                            <td className={cellStyles}>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStartEdit(assetType)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleStartDelete(assetType)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                            <td className={cellStyles}>{normalizeStringDisplay(assetType.name)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        );

      case "field":
        return (
          <>
            <CategoryDropdown
              selectedCategoryName={selectedCategoryName}
              setSelectedCategoryName={setSelectedCategoryName}
              setSelectedCategoryID={setSelectedCategoryID}
              categories={categories}
              categorySearch={categorySearch}
              setCategorySearch={setCategorySearch}
              categoryPopoverOpen={categoryPopoverOpen}
              setCategoryPopoverOpen={setCategoryPopoverOpen}
            />
            {selectedCategoryID && (
              <GroupDropdown
                selectedAssetTypeName={selectedAssetTypeName}
                setSelectedAssetTypeName={setSelectedAssetTypeName}
                setSelectedAssetTypeID={setSelectedAssetTypeID}
                assetTypes={assetTypes}
                assetTypeSearch={assetTypeSearch}
                setAssetTypeSearch={setAssetTypeSearch}
                assetTypePopoverOpen={assetTypePopoverOpen}
                setAssetTypePopoverOpen={setAssetTypePopoverOpen}
              />
            )}
            {selectedAssetTypeID && fields.length > 0 && (
              <div className="mt-4">
                <div className="border border-border rounded-md overflow-hidden">
                  <div className="max-h-[500px] overflow-auto scrollbar-thin">
                    <table className={tableStyles + " table-fixed"}>
                      {createColGroup(4)}
                      <thead>
                        <tr>
                          <th className={headerCellStyles}>Actions</th>
                          <th className={headerCellStyles}>Field Name</th>
                          <th className={headerCellStyles}>Field Type</th>
                          <th className={headerCellStyles}>Units</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((field) => (
                          <tr 
                            key={field.fieldID}
                            className={selectedItem?.fieldID === field.fieldID ? "bg-muted" : ""}
                          >
                            <td className={cellStyles}>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStartEdit(field)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleStartDelete(field)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                            <td className={cellStyles}>{normalizeStringDisplay(field.fieldName)}</td>
                            <td className={cellStyles}>{field.fieldType}</td>
                            <td className={cellStyles}>{field.units || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        );

      case "asset":
        return (
          <>
            <CategoryDropdown
              selectedCategoryName={selectedCategoryName}
              setSelectedCategoryName={setSelectedCategoryName}
              setSelectedCategoryID={setSelectedCategoryID}
              categories={categories}
              categorySearch={categorySearch}
              setCategorySearch={setCategorySearch}
              categoryPopoverOpen={categoryPopoverOpen}
              setCategoryPopoverOpen={setCategoryPopoverOpen}
            />
            {selectedCategoryID && (
              <GroupDropdown
                selectedAssetTypeName={selectedAssetTypeName}
                setSelectedAssetTypeName={setSelectedAssetTypeName}
                setSelectedAssetTypeID={setSelectedAssetTypeID}
                assetTypes={assetTypes}
                assetTypeSearch={assetTypeSearch}
                setAssetTypeSearch={setAssetTypeSearch}
                assetTypePopoverOpen={assetTypePopoverOpen}
                setAssetTypePopoverOpen={setAssetTypePopoverOpen}
              />
            )}
            {selectedAssetTypeID && assetData.length > 0 && (
              <AssetTableHandler
                fields={fields}
                assetData={assetData}
                selectedItem={selectedItem}
                handleStartEdit={handleStartEdit}
                handleStartDelete={handleStartDelete}
              />
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-4">
      <CardHeader className="flex flex-row items-center gap-2">
        <CardTitle>Manage Data</CardTitle>
        <HelpIcon 
            tooltipText="Manage Data is where you can update and delete data. Click to learn more!"
            helpPath="/helpManagingData"
            size="md"
        />
      </CardHeader>
      <CardContent>
        {/* Display success or error message */}
        {success && (
          <div className="mb-4 p-2 bg-green-100 text-green-800 rounded-md transition-opacity duration-500 opacity-100">
            Operation completed successfully!
          </div>
        )}
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-800 rounded-md transition-opacity duration-500 opacity-100">
            {error}
          </div>
        )}

        {/* Permission Denied Popup */}
        <PermissionDeniedPopup 
          isOpen={showPermissionDenied} 
          onOpenChange={setShowPermissionDenied} 
        />

        {/* First Dropdown - Select Item Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Select Item Type</label>
          <Popover open={itemTypePopoverOpen} onOpenChange={setItemTypePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedItemType ? itemTypes.find(i => i.value === selectedItemType)?.label : "Select Item Type"}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0">
              <div className="p-2 border-b">
                <div className="flex items-center gap-2 px-2 py-1 border rounded-md">
                  <Search className="h-4 w-4 opacity-50" />
                  <Input
                    placeholder="Search item types..."
                    className="border-0 p-0 focus-visible:ring-0 h-8"
                    value={itemTypeSearch}
                    onChange={(e) => setItemTypeSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="py-2">
                {filteredItemTypes.map((item) => (
                  <div key={item.value} className="px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
                    onClick={() => { setSelectedItemType(item.value); setItemTypePopoverOpen(false); }}>
                    {item.label}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Render the appropriate table based on selected item type */}
        <div className="mt-4 overflow-x-auto">
          {renderTable()}
        </div>

        {/* Render the UpdateHandler component */}
        <UpdateHandler
          isEditDialogOpen={isEditDialogOpen}
          setIsEditDialogOpen={setIsEditDialogOpen}
          selectedItem={selectedItem}
          selectedItemType={selectedItemType}
          fields={fields}
          setSuccess={setSuccess}
          setError={setError}
          refreshData={refreshData}
          error={error}
        />

        {/* Render the DeleteHandler component */}
        <DeleteHandler
          isDeleteDialogOpen={isDeleteDialogOpen}
          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
          itemToDelete={itemToDelete}
          setItemToDelete={setItemToDelete}
          selectedItemType={selectedItemType}
          fields={fields}
          setSuccess={setSuccess}
          setError={setError}
          refreshData={refreshData}
        />
      </CardContent>
    </Card>
  );
}

