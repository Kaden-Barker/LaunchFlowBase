import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { updateCategory, updateAssetType, updateField, updateEntryInt, updateEntryBool, updateEntryText } from "../../api/update";
import { createEntryInt, createEntryBool, createEntryText } from "../../api/entry";
import { logUserAction, useCurrentUser } from "../../utils/loggingUtils";
import { isDuplicateCategory, isDuplicateAssetType, hasDuplicateEnumOptions } from "../../utils/duplicateChecks";
import { normalizeStringStorage, normalizeStringDisplay } from "../../utils/normalizeData";
import { fetchCategories } from "../../api/categories";
import { fetchAssetType } from "../../api/assettype";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface UpdateHandlerProps {
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (isOpen: boolean) => void;
  selectedItem: any;
  selectedItemType: string | null;
  fields: any[];
  setSuccess: (success: boolean) => void;
  setError: (error: string | null) => void;
  refreshData: () => void;
  error: string | null;
}

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

function formatDateForInput(date: string | undefined): string {
  if (!date) return '';
  // Create date object and adjust for timezone
  const d = new Date(date);
  // Add the timezone offset to get the correct local date
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function UpdateHandler({
  isEditDialogOpen,
  setIsEditDialogOpen,
  selectedItem,
  selectedItemType,
  fields,
  setSuccess,
  setError,
  refreshData,
  error
}: UpdateHandlerProps) {
  const [editFormValues, setEditFormValues] = useState<Record<string, any>>({});
  const currentUser = useCurrentUser();
  const [categories, setCategories] = useState<any[]>([]);
  const [assetTypes, setAssetTypes] = useState<any[]>([]);
  const [newEnumOption, setNewEnumOption] = useState('');

  // Fetch categories and asset types for duplicate checking
  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesData = await fetchCategories();
        setCategories(categoriesData);
        const assetTypesData = await fetchAssetType();
        setAssetTypes(assetTypesData);
      } catch (error) {
        console.error("Error fetching data for duplicate checking:", error);
      }
    };
    fetchData();
  }, [editFormValues]);

  // Initialize form values when the selected item changes
  useEffect(() => {
    if (selectedItem) {
      if (selectedItemType === "category") {
        setEditFormValues({ categoryName: selectedItem.categoryName });
      } else if (selectedItemType === "group") {
        setEditFormValues({ name: selectedItem.name });
      } else if (selectedItemType === "field") {
        setEditFormValues({ 
          fieldName: selectedItem.fieldName,
          fieldType: selectedItem.fieldType,
          units: selectedItem.units || '',
          enumOptions: selectedItem.fieldType === "Enum" ? (selectedItem.enumOptions || []) : []
        });
      } else if (selectedItemType === "asset") {
        const initialValues: Record<string, any> = {};
        // Add safety check for fieldValues
        if (selectedItem.fieldValues) {
          Object.entries(selectedItem.fieldValues).forEach(([fieldName, fieldData]) => {
            initialValues[fieldName] = (fieldData as FieldValue).value;
            initialValues[`${fieldName}_date`] = formatDateForInput((fieldData as FieldValue).date);
          });
        }
        setEditFormValues(initialValues);
      }
    }
  }, [selectedItem, selectedItemType]);

  // Function to handle updating a value in the form
  const handleFormValueChange = (fieldName: string, value: any) => {
    setEditFormValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Function that will call the api to complete the update
  const handleUpdate = async () => {
    setError(null);
    setSuccess(false);

    try {
      let actionType = "";
      let changeDetails = "";
      
      if (selectedItemType === "category" && selectedItem) {
        // Check for duplicate category name
        const normalizedName = isDuplicateCategory(editFormValues.categoryName, categories);
        if (!normalizedName) {
          setError("A category with this name already exists.");
          return;
        }

        await updateCategory(selectedItem.categoryID, normalizedName);
        actionType = "Update Category";
        changeDetails = `Updated category "${selectedItem.categoryName}" to "${normalizedName}"`;
      } else if (selectedItemType === "group" && selectedItem) {
        // Check for duplicate asset type name in the same category
        const normalizedName = isDuplicateAssetType(
          editFormValues.name,
          selectedItem.categoryID,
          assetTypes
        );
        if (!normalizedName) {
          setError("A group with this name already exists in this category.");
          return;
        }

        await updateAssetType(selectedItem.assetTypeID, normalizedName);
        actionType = "Update Group";
        changeDetails = `Updated group "${selectedItem.name}" to "${normalizedName}"`;
      } else if (selectedItemType === "field" && selectedItem) {
        // Check for any field with the same name in the same group
        const existingField = fields.find(
          f => f.fieldID !== selectedItem.fieldID && // Exclude current field
          f.assetTypeID === selectedItem.assetTypeID &&
          normalizeStringStorage(f.fieldName) === normalizeStringStorage(editFormValues.fieldName)
        );

        if (existingField) {
          setError("A field with this name already exists in this group.");
          return;
        }

        // Check for duplicate enum options if this is an enum field
        if (editFormValues.fieldType === "Enum" && hasDuplicateEnumOptions(editFormValues.enumOptions || [])) {
          setError("Cannot have duplicate options in an enum field.");
          return;
        }

        const normalizedName = normalizeStringStorage(editFormValues.fieldName);
        await updateField(
          selectedItem.fieldID, 
          normalizedName, 
          selectedItem.fieldType,
          editFormValues.units,
          editFormValues.fieldType === "Enum" ? editFormValues.enumOptions : []
        );
        actionType = "Update Field";
        changeDetails = `Updated field "${selectedItem.fieldName}" to "${normalizedName}" (${selectedItem.fieldType})`;
      } else if (selectedItemType === "asset" && selectedItem) {
        // For each field in the form
        const updatedFields: string[] = [];
        
        for (const [fieldName, newValue] of Object.entries(editFormValues)) {
          if (fieldName.endsWith('_date')) continue; // Skip date fields
          
          const field = fields.find(f => f.fieldName === fieldName);
          if (!field) continue;

          const fieldData = (selectedItem as AssetData).fieldValues[fieldName];
          const formDateValue = editFormValues[`${fieldName}_date`];
          
          if (fieldData) {
            // Update existing entry if value or date has changed
            if (fieldData.value !== newValue || formDateValue !== fieldData.date) {
              if (fieldData.type === 'int') {
                await updateEntryInt(fieldData.entryID, Number(newValue), formDateValue);
              } else if (fieldData.type === 'bool') {
                await updateEntryBool(fieldData.entryID, Boolean(newValue), formDateValue);
              } else if (fieldData.type === 'text') {
                await updateEntryText(fieldData.entryID, String(newValue), formDateValue);
              }
              
              // Add to updated fields list
              updatedFields.push(`${fieldName}: ${fieldData.value} → ${newValue}`);
            }
          } else if (newValue !== '') {
            // Create new entry if value is provided
            const dateValue = formDateValue || new Date().toISOString().split('T')[0];
            
            if (field.fieldType === 'Double') {
              await createEntryInt(selectedItem.assetID, field.fieldID, Number(newValue), dateValue);
            } else if (field.fieldType === 'Boolean') {
              await createEntryBool(selectedItem.assetID, field.fieldID, Boolean(newValue), dateValue);
            } else if (field.fieldType === 'String' || field.fieldType === 'Enum') {
              await createEntryText(selectedItem.assetID, field.fieldID, String(newValue), dateValue);
            }
            
            // Add to updated fields list
            updatedFields.push(`${fieldName}: added ${newValue}`);
          }
        }
        
        actionType = "Update Asset";
        changeDetails = `Updated asset #${selectedItem.assetID} (${selectedItem.assetTypeName}) with changes: ${updatedFields.join(', ')}`;
      } else {
        throw new Error("Invalid selection for update.");
      }

      // Log the change if user is logged in
      if (currentUser && currentUser.email) {
        try {
          await logUserAction(
            actionType,
            changeDetails,
            currentUser
          );
        } catch (logError) {
          console.error("Error logging change:", logError);
          // Don't throw the error to avoid disrupting the main flow
        }
      }

      refreshData();
      setSuccess(true);
      setIsEditDialogOpen(false);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    }
  };

  const addEnumOption = () => {
    if (newEnumOption.trim()) {
      const normalizedNewOption = normalizeStringStorage(newEnumOption);
      const updatedOptions = [...(editFormValues.enumOptions || []), normalizedNewOption];
      
      if (hasDuplicateEnumOptions(updatedOptions)) {
        setError("This option already exists in the list.");
        return;
      }

      setEditFormValues(prev => ({
        ...prev,
        enumOptions: updatedOptions
      }));
      setNewEnumOption('');
    }
  };

  const removeEnumOption = (index: number) => {
    setEditFormValues(prev => ({
      ...prev,
      enumOptions: prev.enumOptions.filter((_: string, i: number) => i !== index)
    }));
  };

  if (!selectedItem) return null;

  // This is the code for the update form that pops up when the user clicks the update button
  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="sm:max-w-[435px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {selectedItemType}</DialogTitle>
          <DialogDescription>
            Edit form for {selectedItemType} with fields to update
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {selectedItemType === "asset" ? (
            <div className="space-y-4">
              {/* First render existing fields */}
              {fields.map((field) => {
                // Add safety check for selectedItem and fieldValues
                if (!selectedItem || !selectedItem.fieldValues || !(field.fieldName in (selectedItem as AssetData).fieldValues)) {
                  return null;
                }
                
                return (
                  <div key={field.fieldName} className="flex items-center space-x-4">
                    <span className="text-sm font-medium w-1/4">{field.fieldName}</span>
                    <div className="flex items-center w-3/4 space-x-2">
                      {field.fieldType === 'Double' ? (
                        <>
                          <Input
                            type="number"
                            placeholder="Enter a number"
                            className="w-1/2"
                            value={editFormValues[field.fieldName] ?? ''}
                            onChange={(e) => handleFormValueChange(field.fieldName, e.target.value)}
                          />
                          {field.units && (
                            <span className="text-sm text-gray-500">{field.units}</span>
                          )}
                          <Input
                            type="date"
                            className="w-1/2"
                            value={formatDateForInput(editFormValues[`${field.fieldName}_date`])}
                            onChange={(e) => handleFormValueChange(`${field.fieldName}_date`, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.target as HTMLInputElement;
                                input.blur();
                              }
                            }}
                          />
                        </>
                      ) : field.fieldType === 'Boolean' ? (
                        <>
                          <div className="flex items-center w-1/2">
                            <input
                              type="checkbox"
                              id={`field-${field.fieldName}`}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={editFormValues[field.fieldName] ?? false}
                              onChange={(e) => handleFormValueChange(field.fieldName, e.target.checked)}
                            />
                            <label htmlFor={`field-${field.fieldName}`} className="ml-2 text-sm text-gray-700">
                              {editFormValues[field.fieldName] ? "True" : "False"}
                            </label>
                          </div>
                          {field.units && (
                            <span className="text-sm text-gray-500">{field.units}</span>
                          )}
                          <Input
                            type="date"
                            className="w-1/2"
                            value={formatDateForInput(editFormValues[`${field.fieldName}_date`])}
                            onChange={(e) => handleFormValueChange(`${field.fieldName}_date`, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.target as HTMLInputElement;
                                input.blur();
                              }
                            }}
                          />
                        </>
                      ) : field.fieldType === 'Enum' ? (
                        <>
                          <Select
                            value={editFormValues[field.fieldName]}
                            onValueChange={(value) => handleFormValueChange(field.fieldName, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {field.enumOptions?.map((option: string, index: number) => (
                                <SelectItem 
                                  key={index} 
                                  value={option}
                                  className="hover:bg-gray-100 cursor-pointer"
                                >
                                  {normalizeStringDisplay(option)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            type="date"
                            className="w-1/2"
                            value={formatDateForInput(editFormValues[`${field.fieldName}_date`])}
                            onChange={(e) => handleFormValueChange(`${field.fieldName}_date`, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.target as HTMLInputElement;
                                input.blur();
                              }
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <Input
                            type="text"
                            placeholder="Enter text"
                            className="w-1/2"
                            value={editFormValues[field.fieldName] ?? ''}
                            onChange={(e) => handleFormValueChange(field.fieldName, e.target.value)}
                          />
                          {field.units && (
                            <span className="text-sm text-gray-500">{field.units}</span>
                          )}
                          <Input
                            type="date"
                            className="w-1/2"
                            value={formatDateForInput(editFormValues[`${field.fieldName}_date`])}
                            onChange={(e) => handleFormValueChange(`${field.fieldName}_date`, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.target as HTMLInputElement;
                                input.blur();
                              }
                            }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Then render a section for adding new fields only if there are new fields to add */}
              {fields.some(field => !selectedItem?.fieldValues || !(field.fieldName in (selectedItem as AssetData).fieldValues)) && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium mb-4">Add New Fields</h3>
                  {fields.map((field) => {
                    // Add safety check for selectedItem and fieldValues
                    if (!selectedItem || !selectedItem.fieldValues || (field.fieldName in (selectedItem as AssetData).fieldValues)) {
                      return null;
                    }
                    
                    return (
                      <div key={field.fieldName} className="flex items-center space-x-4 mb-4">
                        <span className="text-sm font-medium w-1/4">{field.fieldName}</span>
                        <div className="flex items-center w-3/4 space-x-2">
                          {field.fieldType === 'Double' ? (
                            <>
                              <Input
                                type="number"
                                placeholder="Enter a number"
                                className="w-1/2"
                                value={editFormValues[field.fieldName] ?? ''}
                                onChange={(e) => handleFormValueChange(field.fieldName, e.target.value)}
                              />
                              {field.units && (
                                <span className="text-sm text-gray-500">{field.units}</span>
                              )}
                              <Input
                                type="date"
                                className="w-1/2"
                                value={editFormValues[`${field.fieldName}_date`] ?? formatDateForInput(new Date().toISOString())}
                                onChange={(e) => handleFormValueChange(`${field.fieldName}_date`, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.target as HTMLInputElement;
                                    input.blur();
                                  }
                                }}
                              />
                            </>
                          ) : field.fieldType === 'Boolean' ? (
                            <>
                              <div className="flex items-center w-1/2">
                                <input
                                  type="checkbox"
                                  id={`new-field-${field.fieldName}`}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  checked={editFormValues[field.fieldName] ?? false}
                                  onChange={(e) => handleFormValueChange(field.fieldName, e.target.checked)}
                                />
                                <label htmlFor={`new-field-${field.fieldName}`} className="ml-2 text-sm text-gray-700">
                                  {editFormValues[field.fieldName] ? "True" : "False"}
                                </label>
                              </div>
                              {field.units && (
                                <span className="text-sm text-gray-500">{field.units}</span>
                              )}
                              <Input
                                type="date"
                                className="w-1/2"
                                value={editFormValues[`${field.fieldName}_date`] ?? formatDateForInput(new Date().toISOString())}
                                onChange={(e) => handleFormValueChange(`${field.fieldName}_date`, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.target as HTMLInputElement;
                                    input.blur();
                                  }
                                }}
                              />
                            </>
                          ) : field.fieldType === 'Enum' ? (
                            <>
                              <Select
                                value={editFormValues[field.fieldName]}
                                onValueChange={(value) => handleFormValueChange(field.fieldName, value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.enumOptions?.map((option: string, index: number) => (
                                    <SelectItem 
                                      key={index} 
                                      value={option}
                                      className="hover:bg-gray-100 cursor-pointer"
                                    >
                                      {normalizeStringDisplay(option)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
    
                              <Input
                                type="date"
                                className="w-1/2"
                                value={editFormValues[`${field.fieldName}_date`] ?? formatDateForInput(new Date().toISOString())}
                                onChange={(e) => handleFormValueChange(`${field.fieldName}_date`, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.target as HTMLInputElement;
                                    input.blur();
                                  }
                                }}
                              />
                            </>
                          ) : (
                            <>
                              <Input
                                type="text"
                                placeholder="Enter text"
                                className="w-1/2"
                                value={editFormValues[field.fieldName] ?? ''}
                                onChange={(e) => handleFormValueChange(field.fieldName, e.target.value)}
                              />
                              {field.units && (
                                <span className="text-sm text-gray-500">{field.units}</span>
                              )}
                              <Input
                                type="date"
                                className="w-1/2"
                                value={editFormValues[`${field.fieldName}_date`] ?? formatDateForInput(new Date().toISOString())}
                                onChange={(e) => handleFormValueChange(`${field.fieldName}_date`, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.target as HTMLInputElement;
                                    input.blur();
                                  }
                                }}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : selectedItemType === "category" ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium w-1/2">Category Name</span>
              <Input
                type="text"
                value={editFormValues.categoryName}
                onChange={(e) => handleFormValueChange('categoryName', e.target.value)}
                className="w-1/2"
              />
            </div>
          ) : selectedItemType === "group" ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium w-1/2">Group Name</span>
              <Input
                type="text"
                value={editFormValues.name}
                onChange={(e) => handleFormValueChange('name', e.target.value)}
                className="w-1/2"
              />
            </div>
          ) : selectedItemType === "field" ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium w-1/2">Field Name</span>
                <Input
                  type="text"
                  value={editFormValues.fieldName}
                  onChange={(e) => handleFormValueChange('fieldName', e.target.value)}
                  className="w-1/2"
                />
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium w-1/2">Units</span>
                <Input
                  type="text"
                  value={editFormValues.units || ''}
                  onChange={(e) => handleFormValueChange('units', e.target.value)}
                  className="w-1/2"
                  placeholder="Enter units (optional)"
                />
              </div>
              {editFormValues.fieldType === "Enum" && (
                <div className="space-y-2">
                  {/* Input for new option */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter an option"
                      value={newEnumOption}
                      onChange={(e) => setNewEnumOption(e.target.value)}
                    />
                    <Button
                      type="button"
                      onClick={addEnumOption}
                      className="px-3"
                    >
                      +
                    </Button>
                  </div>
                  {/* List of current options */}
                  <div className="space-y-2">
                    {(editFormValues.enumOptions || []).map((option: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          readOnly
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeEnumOption(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Click + to add an option
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-800 rounded-md transition-opacity duration-500 opacity-100">
            {error}
          </div>
        )}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdate}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 