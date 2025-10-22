-- Task Management System Database Schema
-- Run this script to create the Application, Plan, and Task tables

USE `nodelogin`;

-- ============================================
-- Application Table
-- ============================================
CREATE TABLE IF NOT EXISTS `application` (
  `App_Acronym` VARCHAR(50) NOT NULL,
  `App_Description` TEXT,
  `App_Rnumber` INT NOT NULL DEFAULT 0,
  `App_startDate` DATE,
  `App_endDate` DATE,
  `App_permit_Open` VARCHAR(50),       -- User group that can create tasks (Open state)
  `App_permit_toDoList` VARCHAR(50),   -- User group that can release tasks to ToDo
  `App_permit_Doing` VARCHAR(50),      -- User group that can work on tasks (Doing state)
  `App_permit_Done` VARCHAR(50),       -- User group that can approve/close tasks (Done state)
  PRIMARY KEY (`App_Acronym`)
);

-- ============================================
-- Plan Table
-- ============================================
CREATE TABLE IF NOT EXISTS `plan` (
  `Plan_MVP_name` VARCHAR(100) NOT NULL,
  `Plan_startDate` DATE,
  `Plan_endDate` DATE,
  `Plan_app_Acronym` VARCHAR(50) NOT NULL,
  `Plan_color` VARCHAR(7) DEFAULT '#3498db',  -- Hex color for visual distinction
  PRIMARY KEY (`Plan_MVP_name`, `Plan_app_Acronym`),
  FOREIGN KEY (`Plan_app_Acronym`) REFERENCES `application`(`App_Acronym`) ON DELETE CASCADE
);

-- ============================================
-- Task Table
-- ============================================
CREATE TABLE IF NOT EXISTS `task` (
  `Task_id` VARCHAR(100) NOT NULL,
  `Task_name` VARCHAR(100) NOT NULL,
  `Task_description` TEXT,
  `Task_notes` LONGTEXT,                    -- Audit trail of all notes (JSON format)
  `Task_plan` VARCHAR(100),                 -- Can be NULL if not assigned to a plan
  `Task_app_Acronym` VARCHAR(50) NOT NULL,
  `Task_state` ENUM('Open', 'ToDo', 'Doing', 'Done', 'Closed') NOT NULL DEFAULT 'Open',
  `Task_creator` VARCHAR(50) NOT NULL,
  `Task_owner` VARCHAR(50) NOT NULL,
  `Task_createDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Task_id`),
  FOREIGN KEY (`Task_app_Acronym`) REFERENCES `application`(`App_Acronym`) ON DELETE CASCADE
);

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Sample Application
INSERT INTO `application` (`App_Acronym`, `App_Description`, `App_Rnumber`, `App_startDate`, `App_endDate`,
  `App_permit_Open`, `App_permit_toDoList`, `App_permit_Doing`, `App_permit_Done`)
VALUES
  ('DEMO', 'Demo Project for Task Management System', 0, '2025-01-01', '2025-12-31',
   'admin', 'admin', 'developer', 'admin')
ON DUPLICATE KEY UPDATE `App_Acronym` = `App_Acronym`;

-- Sample Plans
INSERT INTO `plan` (`Plan_MVP_name`, `Plan_startDate`, `Plan_endDate`, `Plan_app_Acronym`, `Plan_color`)
VALUES
  ('Sprint 1', '2025-01-01', '2025-03-31', 'DEMO', '#3498db'),
  ('Sprint 2', '2025-04-01', '2025-06-30', 'DEMO', '#2ecc71')
ON DUPLICATE KEY UPDATE `Plan_MVP_name` = `Plan_MVP_name`;
