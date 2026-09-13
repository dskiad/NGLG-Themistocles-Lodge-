CREATE TABLE `lodge_content` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` text NOT NULL,
	`owner_id` text NOT NULL
);
