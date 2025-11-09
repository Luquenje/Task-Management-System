-- Migration script to make Task_owner nullable
-- This allows tasks to have no owner until picked up by a developer

USE `task_management`;

-- Modify the Task_owner column to allow NULL values
ALTER TABLE `task`
MODIFY COLUMN `Task_owner` VARCHAR(50) NULL;

-- Update existing tasks in Open and ToDo states to have NULL owner
-- (optional - only if you want to reset existing tasks)
-- UPDATE `task`
-- SET `Task_owner` = NULL
-- WHERE `Task_state` IN ('Open', 'ToDo');
