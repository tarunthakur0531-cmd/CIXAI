CREATE TABLE `agents` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`type` enum('research','coding','content','planning','automation','browser','email') NOT NULL,
	`status` enum('idle','active','paused') NOT NULL DEFAULT 'idle',
	`description` text,
	`config` text,
	`lastRunAt` bigint,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` varchar(36) NOT NULL,
	`sessionId` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`tokensUsed` int,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatSessions` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(256),
	`modelId` varchar(128),
	`messageCount` int DEFAULT 0,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `chatSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`payload` text,
	`agentId` varchar(36),
	`memoryId` varchar(36),
	`taskId` varchar(36),
	`createdAt` bigint NOT NULL,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insights` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`type` enum('daily','weekly','monthly','pattern','opportunity','prediction','reflection') NOT NULL,
	`title` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`metrics` text,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memories` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`title` varchar(256),
	`category` enum('note','idea','decision','fact','observation','project','meeting','document','learning','research') NOT NULL DEFAULT 'note',
	`tags` text,
	`source` varchar(64),
	`aiModel` varchar(64),
	`confidenceScore` int DEFAULT 50,
	`project` varchar(128),
	`people` text,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `memories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`status` enum('pending','thinking','done') NOT NULL DEFAULT 'pending',
	`priority` enum('low','medium','high','critical') DEFAULT 'medium',
	`subtasks` text,
	`agentId` varchar(36),
	`progress` int DEFAULT 0,
	`memoryIds` text,
	`result` text,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
