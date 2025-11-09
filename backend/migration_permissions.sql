-- Migration script to update permission columns in application table
-- This script updates the permission structure to be more explicit

USE `task_management`;

-- Add the new App_permit_Create column
ALTER TABLE `application`
ADD COLUMN `App_permit_Create` VARCHAR(50) AFTER `App_endDate`;

-- Add the new App_permit_ToDo column
ALTER TABLE `application`
ADD COLUMN `App_permit_ToDo` VARCHAR(50) AFTER `App_permit_Open`;

-- Copy data from old columns to new structure:
-- Old App_permit_Open (create tasks) -> New App_permit_Create
UPDATE `application`
SET `App_permit_Create` = `App_permit_Open`;

-- Old App_permit_toDoList (release to ToDo) -> Keep as App_permit_Open (will rename)
-- Old App_permit_Doing -> Copy to App_permit_ToDo (pickup tasks)
UPDATE `application`
SET `App_permit_ToDo` = `App_permit_Doing`;

-- Now rename the columns:
-- Rename App_permit_toDoList to App_permit_Open (this is now "release to ToDo")
ALTER TABLE `application`
CHANGE COLUMN `App_permit_toDoList` `App_permit_Open_temp` VARCHAR(50);

-- Drop the old App_permit_Open column (already copied to App_permit_Create)
ALTER TABLE `application`
DROP COLUMN `App_permit_Open`;

-- Rename the temp column to App_permit_Open
ALTER TABLE `application`
CHANGE COLUMN `App_permit_Open_temp` `App_permit_Open` VARCHAR(50);

-- Reorder columns for consistency
ALTER TABLE `application`
MODIFY COLUMN `App_permit_Create` VARCHAR(50) AFTER `App_endDate`,
MODIFY COLUMN `App_permit_Open` VARCHAR(50) AFTER `App_permit_Create`,
MODIFY COLUMN `App_permit_ToDo` VARCHAR(50) AFTER `App_permit_Open`,
MODIFY COLUMN `App_permit_Doing` VARCHAR(50) AFTER `App_permit_ToDo`,
MODIFY COLUMN `App_permit_Done` VARCHAR(50) AFTER `App_permit_Doing`;
