CREATE TABLE `booking_players` (
	`booking_id` integer NOT NULL,
	`uni_id` text NOT NULL,
	`week` text NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "players_uni_id_ck" CHECK("uni_id" GLOB 'u[0-9][0-9][0-9][0-9][0-9][0-9][0-9]')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `players_week_uq` ON `booking_players` (`uni_id`,`week`);--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resource_id` integer NOT NULL,
	`date` text NOT NULL,
	`hour` integer NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "bookings_date_ck" CHECK("date" IS date("date")),
	CONSTRAINT "bookings_weekday_ck" CHECK(strftime('%w', "date") NOT IN ('0', '6')),
	CONSTRAINT "bookings_hour_ck" CHECK("hour" BETWEEN 6 AND 13)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_slot_uq` ON `bookings` (`resource_id`,`date`,`hour`);--> statement-breakpoint
CREATE TABLE `resources` (
	`id` integer PRIMARY KEY NOT NULL,
	`venue` text NOT NULL,
	`name` text NOT NULL,
	`sports` text NOT NULL
);
