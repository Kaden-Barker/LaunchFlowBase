import { deleteAsset, deleteAssetType, deleteField, deleteCategory } from "../../api/delete";
import { DeleteConfirmationPopup } from "./DeleteConfirmationPopup";
import { logUserAction, useCurrentUser } from "../../utils/loggingUtils";

interface DeleteHandlerProps {
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (isOpen: boolean) => void;
  itemToDelete: any;
  setItemToDelete: (item: any) => void;
  selectedItemType: string | null;
  fields: any[];
  setSuccess: (success: boolean) => void;
  setError: (error: string | null) => void;
  refreshData: () => void;
}

export function DeleteHandler({
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  itemToDelete,
  setItemToDelete,
  selectedItemType,
  fields,
  setSuccess,
  setError,
  refreshData
}: DeleteHandlerProps) {
  const currentUser = useCurrentUser();
  
  // Function to handle the delete operation
  const handleDelete = async () => {
    setError(null);
    setSuccess(false);

    try {
      let actionType = "";
      let changeDetails = "";
      
      if (selectedItemType === "category" && itemToDelete) {
        await deleteCategory(itemToDelete.categoryID);
        actionType = "Delete Category";
        changeDetails = `Deleted category "${itemToDelete.categoryName}"`;
      } else if (selectedItemType === "group" && itemToDelete) {
        await deleteAssetType(itemToDelete.assetTypeID);
        actionType = "Delete Group";
        changeDetails = `Deleted group "${itemToDelete.name}"`;
      } else if (selectedItemType === "field" && itemToDelete) {
        await deleteField(itemToDelete.fieldID);
        actionType = "Delete Field";
        changeDetails = `Deleted field "${itemToDelete.fieldName}"`;
      } else if (selectedItemType === "asset" && itemToDelete) {
        await deleteAsset(itemToDelete.assetID);
        actionType = "Delete Asset";
        changeDetails = `Deleted Asset (${itemToDelete.assetTypeName})`;
      } else {
        throw new Error("Invalid selection for deletion.");
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
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      setError(err.message || "Something went wrong with deletion.");
    }
  };

  if (!itemToDelete) return null;

  let itemName = "";
  let itemType = selectedItemType || "";
  
  if (itemType === "category" && 'categoryName' in itemToDelete) {
    itemName = itemToDelete.categoryName;
  } else if (itemType === "group" && 'name' in itemToDelete) {
    itemName = itemToDelete.name;
  } else if (itemType === "field" && 'fieldName' in itemToDelete) {
    itemName = itemToDelete.fieldName;
  } else if (itemType === "asset") {
    // For assets, try to find a meaningful identifier
    if (fields.length > 0) {
      // Look for a field that might serve as a good identifier (if it exists in this asset)
      const identifierField = fields.find(f => 
        (f.fieldName.toLowerCase().includes('name') || f.fieldName.toLowerCase().includes('id') || f.fieldName.toLowerCase().includes('number'))
        && itemToDelete.fieldValues[f.fieldName]
      );
      
      if (identifierField) {
        const fieldValue = itemToDelete.fieldValues[identifierField.fieldName];
        itemName = `${identifierField.fieldName}: ${fieldValue.value}`;
      } else {
        // If no good identifier, fall back to assetID
        itemName = `Asset #${itemToDelete.assetID}`;
      }
    } else {
      itemName = `Asset #${itemToDelete.assetID}`;
    }
  }

  return (
    <DeleteConfirmationPopup
      isOpen={isDeleteDialogOpen}
      onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) setItemToDelete(null);
      }}
      onConfirm={handleDelete}
      itemType={itemType}
      itemName={itemName}
    />
  );
} 