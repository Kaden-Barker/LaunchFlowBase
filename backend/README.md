# Rusted Gate Farm Data Management - Database Design

## Overview
This database is designed to manage various aspects of Rusted Gate Farm's operations. The system uses a flexible schema that allows for different types of assets and their associated data.

## Database Structure

### Core Tables

#### Category
- Primary table for organizing different types of farm assets (highest level of organization)
- Fields:
  - `categoryID` (INT, Primary Key)
  - `categoryName` (VARCHAR(255))

#### AssetType
- Defines specific types of assets within each category (aka: Group or subcategory)
- Fields:
  - `assetTypeID` (INT, Primary Key)
  - `categoryID` (INT, Foreign Key)
  - `name` (VARCHAR(255))

#### Field
- Defines the properties that can be tracked for each asset type
- Fields:
  - `fieldID` (INT, Primary Key)
  - `fieldName` (VARCHAR(255))
  - `assetTypeID` (INT, Foreign Key)
  - `fieldType` (ENUM: 'Double', 'String', 'Boolean', 'Enum')
  - `units` (VARCHAR(50))

#### FieldEnumOptions
- Stores possible values for fields of type 'Enum'
- Fields:
  - `optionID` (INT, Primary Key)
  - `fieldID` (INT, Foreign Key)
  - `optionValue` (VARCHAR(255))

#### Asset
- Represents individual instances of assets
- Fields:
  - `assetID` (INT, Primary Key)
  - `assetTypeID` (INT, Foreign Key)

### Data Entry Tables

#### EntryInt
- Stores numerical data entries
- Fields:
  - `entryID` (INT, Primary Key)
  - `fieldID` (INT, Foreign Key)
  - `assetID` (INT, Foreign Key)
  - `value` (DOUBLE)
  - `date` (DATE)

#### EntryText
- Stores text-based data entries
- Fields:
  - `entryID` (INT, Primary Key)
  - `fieldID` (INT, Foreign Key)
  - `assetID` (INT, Foreign Key)
  - `text` (VARCHAR(255))
  - `date` (DATE)

#### EntryBool
- Stores boolean data entries
- Fields:
  - `entryID` (INT, Primary Key)
  - `fieldID` (INT, Foreign Key)
  - `assetID` (INT, Foreign Key)
  - `trueFalse` (BOOLEAN)
  - `date` (DATE)

### User Management Tables

#### Users
- Stores user information
- Fields:
  - `userID` (INT, Primary Key)
  - `userName` (VARCHAR(255))
  - `userEmail` (VARCHAR(255), UNIQUE)
  - `groupID` (INT, Foreign Key)

#### UserGroups
- Defines user permission groups
- Fields:
  - `groupID` (INT, Primary Key)
  - `groupName` (VARCHAR(255), UNIQUE)

#### Permissions
- Defines available permissions
- Fields:
  - `permissionID` (INT, Primary Key)
  - `permissionName` (VARCHAR(255), UNIQUE)

#### PermissionGroup
- Maps permissions to user groups
- Fields:
  - `permissionID` (INT, Foreign Key)
  - `groupID` (INT, Foreign Key)

### Logging Tables

#### change_log
- Tracks changes made to the database
- Fields:
  - `id` (INT, Primary Key)
  - `user_email` (VARCHAR(255))
  - `action` (VARCHAR(50))
  - `change_details` (VARCHAR(255))
  - `timestamp` (TIMESTAMP)

## Security Features

### Admin Protection Triggers
The database includes several triggers to protect administrative functionality:

1. `prevent_admin_group_deletion`: Prevents deletion of the Admin user group
2. `prevent_last_admin_deletion`: Prevents deletion of the last admin user
3. `prevent_last_admin_update`: Prevents removing the last admin from the Admin group
4. `prevent_admin_group_update`: Prevents modification of the Admin group name

### User Groups and Permissions
The system implements three default user groups with specific permissions. The user can change these and add new ones as desired. The Admin group cannot be changed or delete, it is required:

1. **Admin**
   - Full access to all features
   - Can manage users, categories, asset types, and fields
   - Can perform all CRUD operations
   - Can view logs and manage permissions

2. **Manager**
   - Can manage categories, asset types, and fields
   - Can perform all CRUD operations
   - Can view logs
   - Cannot manage users

3. **Employee**
   - Can insert and update data
   - Can search records
   - Limited to basic operations

## Usage Examples

### Adding a New Asset
1. First, ensure the category exists in the `Category` table
2. Add the asset type to the `AssetType` table
3. Define the fields for the asset type in the `Field` table
4. If using Enum fields, add the possible values to `FieldEnumOptions`
5. Create the asset instance in the `Asset` table
6. Add data entries using the insert data page. The location of the data is handled based on the fieldType

## Technical Details

### Hosting Environment
- Database is hosted on Digital Ocean's Managed MySQL service
- Benefits:
  - Automated backups and point-in-time recovery within 7 days
  - Managed security updates and patches
  - Built-in monitoring and alerting
  - Automated scaling capabilities
- Connection:
  - Details are provided in the Top directory README. The connection is done in the middleware. This is also where the CRUD operations are done.
