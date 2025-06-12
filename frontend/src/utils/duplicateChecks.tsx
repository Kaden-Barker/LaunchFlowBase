import { normalizeStringStorage } from "./normalizeData";

export const isDuplicateCategory = (
    input: string, 
    list: Array<{ categoryName: string }> 
): string | false => {

    const normalizedInput = normalizeStringStorage(input);
    const isDuplicate = list.some((cat) => {
      return normalizeStringStorage(cat.categoryName) === normalizedInput
    });
    return isDuplicate ? false : normalizedInput;
  };
  

  export const isDuplicateAssetType = (
    input: string,
    categoryID: number | null,
    list: Array<{ name: string; categoryID: number }>
  ): string | false => {
    if (categoryID === null) return false;
  
    const normalizedInput = normalizeStringStorage(input);
  
    const isDuplicate = list.some((item) => {
      return (
        normalizeStringStorage(item.name) === normalizedInput &&
        item.categoryID === categoryID
      );
    });
  
    return isDuplicate ? false : normalizedInput;
  };
  


// Checks when adding a field and adding the field to an entire category
// check if the field conflicts with an existing field in that asset type
export const isConflictingField = (
  fieldName: string,
  fieldType: string,
  fields: Array<{ assetTypeID: string; fieldName: string; fieldType: string }>,
  assetTypes: Array<{ assetTypeID: string; name: string }>
) => {
  const normalizedFieldName = normalizeStringStorage(fieldName);
  return fields.find(
    (item) =>
      normalizeStringStorage(item.fieldName) === normalizedFieldName &&
      assetTypes.some((type) => type.assetTypeID === item.assetTypeID) &&
      item.fieldType !== fieldType
  );
};

// check if the entered field exists in the given assettype
export const doesFieldExist = (
  fieldName: string,
  fields: Array<{ assetTypeID: number; fieldName: string }>,
  assetTypeID: number | null
): string | false => {
  if (assetTypeID === null) return false;

  const normalizedFieldName = normalizeStringStorage(fieldName);
  const isDuplicate = fields.some(
    (item) =>
      item.assetTypeID === assetTypeID &&
      normalizeStringStorage(item.fieldName) === normalizedFieldName
  );
  return isDuplicate ? false : normalizedFieldName;
};


// check the units of a  field that already exists
export const getExistingFieldUnits = (
  fieldName: string,
  fields: Array<{ assetTypeID: string; fieldName: string; units: string }>,
  assetTypes: Array<{ assetTypeID: string }>
): string | null => {
  const normalizedFieldName = normalizeStringStorage(fieldName);
  const existing = fields.find(
    (item) =>
      normalizeStringStorage(item.fieldName) === normalizedFieldName &&
      assetTypes.some((type) => type.assetTypeID === item.assetTypeID)
  );
  return existing ? existing.units : null;
};

// check if there are any duplicate enum options within a field
// returns true if there are duplicates, false otherwise
export const hasDuplicateEnumOptions = (
  options: string[]
): boolean => {
  const normalizedOptions = options.map(opt => normalizeStringStorage(opt));
  const uniqueOptions = new Set(normalizedOptions);
  
  return uniqueOptions.size !== normalizedOptions.length;
};

// Check if an existing enum field has different options than the new options
// Returns the conflicting asset type ID if there's a conflict, null otherwise
export const hasConflictingEnumOptions = (
  fieldName: string,
  newOptions: string[],
  fields: Array<{ assetTypeID: string; fieldName: string; fieldType: string; enumOptions?: string[] }>,
  assetTypes: Array<{ assetTypeID: string }>
): string | null => {
  const normalizedFieldName = normalizeStringStorage(fieldName);
  const normalizedNewOptions = newOptions.map(opt => normalizeStringStorage(opt)).sort();

  const existingField = fields.find(field => 
    normalizeStringStorage(field.fieldName) === normalizedFieldName &&
    assetTypes.some(type => type.assetTypeID === field.assetTypeID) &&
    field.fieldType === 'Enum'
  );

  if (!existingField || !existingField.enumOptions) return null;

  const normalizedExisting = existingField.enumOptions.map(opt => normalizeStringStorage(opt)).sort();
  
  return JSON.stringify(normalizedExisting) !== JSON.stringify(normalizedNewOptions) 
    ? existingField.assetTypeID 
    : null;
};