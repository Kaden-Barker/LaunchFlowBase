USE defaultdb;

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Drop child tables first
DROP TABLE IF EXISTS PermissionGroup;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Permissions;
DROP TABLE IF EXISTS UserGroups;

DROP TABLE IF EXISTS EntryText;
DROP TABLE IF EXISTS EntryBool;
DROP TABLE IF EXISTS EntryInt;

DROP TABLE IF EXISTS Asset;
DROP TABLE IF EXISTS FieldEnumOptions;
DROP TABLE IF EXISTS Field;
DROP TABLE IF EXISTS AssetType;
DROP TABLE IF EXISTS Category;

DROP TABLE IF EXISTS ChangeLog;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create tables
CREATE TABLE Category (
    categoryID INT PRIMARY KEY AUTO_INCREMENT,
    categoryName VARCHAR(255) NOT NULL
);

CREATE TABLE AssetType (
    assetTypeID INT PRIMARY KEY AUTO_INCREMENT,
    categoryID INT,
    name VARCHAR(255) NOT NULL,
    FOREIGN KEY (categoryID) REFERENCES Category(categoryID) ON DELETE CASCADE
);

CREATE TABLE Field (
    fieldID INT PRIMARY KEY AUTO_INCREMENT,
    fieldName VARCHAR(255) NOT NULL,
    assetTypeID INT,
    fieldType ENUM('Double', 'String', 'Boolean', 'Enum') NOT NULL,
    units VARCHAR(50),
    FOREIGN KEY (assetTypeID) REFERENCES AssetType(assetTypeID) ON DELETE CASCADE
);

-- Create table for storing enum options
CREATE TABLE FieldEnumOptions (
    optionID INT PRIMARY KEY AUTO_INCREMENT,
    fieldID INT NOT NULL,
    optionValue VARCHAR(255) NOT NULL,
    FOREIGN KEY (fieldID) REFERENCES Field(fieldID) ON DELETE CASCADE
); 

CREATE TABLE Asset (
    assetID INT PRIMARY KEY AUTO_INCREMENT,
    assetTypeID INT,
    FOREIGN KEY (assetTypeID) REFERENCES AssetType(assetTypeID) ON DELETE CASCADE
);

CREATE TABLE EntryInt (
    entryID INT PRIMARY KEY AUTO_INCREMENT,
    fieldID INT,
    assetID INT,
    value DOUBLE NOT NULL,
    date DATE NOT NULL,
    FOREIGN KEY (fieldID) REFERENCES Field(fieldID) ON DELETE CASCADE,
    FOREIGN KEY (assetID) REFERENCES Asset(assetID) ON DELETE CASCADE
);

CREATE TABLE EntryBool (
    entryID INT PRIMARY KEY AUTO_INCREMENT,
    fieldID INT,
    assetID INT,
    trueFalse BOOLEAN NOT NULL,
    date DATE NOT NULL,
    FOREIGN KEY (fieldID) REFERENCES Field(fieldID) ON DELETE CASCADE,
    FOREIGN KEY (assetID) REFERENCES Asset(assetID) ON DELETE CASCADE
);

CREATE TABLE EntryText (
    entryID INT PRIMARY KEY AUTO_INCREMENT,
    fieldID INT,
    assetID INT,
    text VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    FOREIGN KEY (fieldID) REFERENCES Field(fieldID) ON DELETE CASCADE,
    FOREIGN KEY (assetID) REFERENCES Asset(assetID) ON DELETE CASCADE
);


CREATE TABLE UserGroups (
    groupID INT PRIMARY KEY AUTO_INCREMENT,
    groupName VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE Permissions (
    permissionID INT PRIMARY KEY AUTO_INCREMENT,
    permissionName VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE Users (
    userID INT PRIMARY KEY AUTO_INCREMENT,
    userName VARCHAR(255) NOT NULL,
    userEmail VARCHAR(255) NOT NULL UNIQUE,
    groupID INT,
    FOREIGN KEY (groupID) REFERENCES UserGroups(groupID)
);

CREATE TABLE PermissionGroup (
    permissionID INT,
    groupID INT,
    PRIMARY KEY (permissionID, groupID),
    FOREIGN KEY (permissionID) REFERENCES Permissions(permissionID),
    FOREIGN KEY (groupID) REFERENCES UserGroups(groupID)
);

CREATE TABLE ChangeLog (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userEmail VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    changeDetails VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);	


-- Truncate tables in correct order to handle foreign key constraints
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE ChangeLog;
TRUNCATE TABLE EntryText;
TRUNCATE TABLE EntryBool;
TRUNCATE TABLE EntryInt;
TRUNCATE TABLE Asset;
TRUNCATE TABLE Field;
TRUNCATE TABLE AssetType;
TRUNCATE TABLE Category;
SET FOREIGN_KEY_CHECKS = 1;

-- Insert Categories
INSERT INTO Category (categoryName) VALUES 
('produce'), 
('cattle'), 
('hay');

-- Insert AssetTypes
INSERT INTO AssetType (categoryID, name) VALUES 
(1, 'lettuce'), 
(1, 'tomato'), 
(2, 'cows'),
(3, 'alfalfa'),
(3, 'timothy');

-- Insert Fields
INSERT INTO Field (fieldName, assetTypeID, fieldType, units) VALUES 
-- Cattle Fields
('sex', 3, 'Enum', NULL),
('weaning_weight', 3, 'Double', 'lbs'),
('yearly_weight', 3, 'Double', 'lbs'),
('harvest_weight', 3, 'Double', 'lbs'),
-- Produce Fields
('amount', 1, 'Double', 'heads'),
('amount', 2, 'Double', 'lbs'),
-- Hay Fields
('bale_weight', 4, 'Double', 'lbs'),
('bale_weight', 5, 'Double', 'lbs'),
('moisture_content', 4, 'Double', '%'),
('moisture_content', 5, 'Double', '%');

INSERT INTO FieldEnumOptions (fieldID, optionValue) VALUES
(1, 'h'),
(1, 's');

-- Insert Assets
INSERT INTO Asset (assetTypeID) VALUES 
(1), -- Lettuce Batch 1
(1), -- Lettuce Batch 2
(2), -- Tomato Batch 1
(3), -- Cow 1
(3), -- Cow 2
(4), -- Alfalfa Bale 1
(5); -- Timothy Bale 1

-- Insert Integer/Double Entries
INSERT INTO EntryInt (fieldID, assetID, value, date) VALUES 
-- Lettuce (Amount)
(5, 1, 200, '2024-02-01'),
(5, 2, 180, '2024-02-15'),
-- Tomato (Amount)
(6, 3, 150, '2024-02-01'),
-- Cow 1 (Weights)
(2, 4, 500, '2024-01-15'),
(3, 4, 900, '2024-02-01'),
(4, 4, 1200, '2024-02-15'),
-- Cow 2 (Weights)
(2, 5, 520, '2024-01-15'),
(3, 5, 950, '2024-02-01'),
(4, 5, 1250, '2024-02-15'),
-- Hay (Weights and Moisture)
(7, 6, 1200, '2024-02-01'),
(9, 6, 12.5, '2024-02-01'),
(8, 7, 1100, '2024-02-01'),
(10, 7, 11.8, '2024-02-01');

-- Insert Text Entries
INSERT INTO EntryText (fieldID, assetID, text, date) VALUES 
-- Cattle Sex
(1, 4, 'h', '2024-01-15'),
(1, 5, 's', '2024-01-15');

-- Insert Boolean Entries (if needed)
INSERT INTO EntryBool (fieldID, assetID, trueFalse, date) VALUES
(1, 4, true, '2024-02-01'),
(1, 5, true, '2024-02-01');


INSERT INTO UserGroups (groupID, groupName) VALUES
(1, 'Admin'),
(2, 'Manager'),
(3, 'Employee');

INSERT INTO Permissions (permissionID, permissionName) VALUES
(1, 'manage_categories'),
(2, 'manage_asset_types'),
(3, 'manage_fields'),
(4, 'insert_data'),
(5, 'update_data'),
(6, 'delete_data'),
(7, 'view_logs'),
(8, 'manage_users'),
(9, 'search');

#Admin
INSERT INTO PermissionGroup (permissionID, groupID) VALUES
(1, 1),
(2, 1),
(3, 1),
(4, 1),
(5, 1),
(6, 1),
(7, 1),
(8, 1),
(9, 1);

# Manager
INSERT INTO PermissionGroup (permissionID, groupID) VALUES
(1, 2),
(2, 2),
(3, 2),
(4, 2),
(5, 2),
(6, 2),
(7, 2),
(9, 2);

# Employee
INSERT INTO PermissionGroup (permissionID, groupID) VALUES
(4, 3),
(5, 3),
(9, 3);

INSERT INTO Users (userID, userName, userEmail, groupID) VALUES
(1, 'Charles', 'admin1@example.com', 1),
(2, 'Manager', 'manager1@example.com', 2),
(3, 'Employee', 'employee1@example.com', 3),
(4, 'Employee', 'employee2@example.com', 3);


DELIMITER $$

-- Prevent deletion of Admin group
CREATE TRIGGER prevent_admin_group_deletion
BEFORE DELETE ON UserGroups
FOR EACH ROW
BEGIN
    IF OLD.groupID = 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete Admin group.';
    END IF;
END $$

-- Prevent deleting the last admin user
CREATE TRIGGER prevent_last_admin_deletion
BEFORE DELETE ON Users
FOR EACH ROW
BEGIN
    DECLARE admin_count INT;

    IF OLD.groupID = 1 THEN
        SELECT COUNT(*) INTO admin_count
        FROM Users
        WHERE groupID = 1 AND userID != OLD.userID;

        IF admin_count = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot delete the last admin user.';
        END IF;
    END IF;
END $$

-- Prevent reassigning the last admin to another group
CREATE TRIGGER prevent_last_admin_update
BEFORE UPDATE ON Users
FOR EACH ROW
BEGIN
    DECLARE admin_count INT;

    IF OLD.groupID = 1 AND NEW.groupID != 1 THEN
        SELECT COUNT(*) INTO admin_count
        FROM Users
        WHERE groupID = 1 AND userID != OLD.userID;

        IF admin_count = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot remove the last admin user from the Admin group.';
        END IF;
    END IF;
END $$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER prevent_admin_group_update
BEFORE UPDATE ON UserGroups
FOR EACH ROW
BEGIN
  IF OLD.groupName = 'Admin' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cannot update the Admin group.';
  END IF;
END $$

DELIMITER ;

INSERT INTO Users (userName, userEmail, groupID) VALUES
('Jo Ann Shannon', 'jshannon@rustedgatefarm.org', 1),
('Dave Picanso', 'dpicanso@rustedgatefarm.org', 1),
('John Souza', 'jsouza@rustedgatefarm.org', 1),
('Cherie Zarbo', 'czarbo@rustedgatefarm.org', 1),
('Jace Picanso', 'jpicanso@rustedgatefarm.org', 1),
('Micah Hillis', 'mhillis@rustedgatefarm.org', 1),
('Chase Garcia', 'cgarcia@rustedgatefarm.org', 1),
('Jon Horrocks', 'jhorrocks@rustedgatefarm.org', 1),
('Will Davis', 'wdavis@rustedgatefarm.org', 1),
('Devin McRae', 'dmcrae@rustedgatefarm.org', 1),
('Megan Capp', 'mcapp@rustedgatefarm.org', 1),
('Anna Stevens', 'astevens@rustedgatefarm.org', 1),
('Justin Southwick', 'jsouthwick@rustedgatefarm.org', 1),
('Justin Cabral', 'jcabral@rustedgatefarm.org', 1),
('Kara Glass', 'kglass@rustedgatefarm.org', 1),
('Jeff Gowen', 'jgowen@rustedgatefarm.org', 1),
('Adrienne Covington', 'acovington@rustedgatefarm.org', 1),
('test', 'soutest@rustedgatefarm.org', 1);