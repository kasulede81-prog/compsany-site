CREATE TABLE `public_content` (`key` text PRIMARY KEY NOT NULL, `value` text NOT NULL, `updated_at` integer NOT NULL);
--> statement-breakpoint
CREATE TABLE `catalog_items` (`id` text PRIMARY KEY NOT NULL, `service` text NOT NULL, `name` text NOT NULL, `category` text NOT NULL DEFAULT '', `summary` text NOT NULL DEFAULT '', `image_url` text NOT NULL DEFAULT '', `website_url` text NOT NULL DEFAULT '', `status` text NOT NULL DEFAULT 'Available', `featured` integer NOT NULL DEFAULT 0, `published` integer NOT NULL DEFAULT 0, `updated_at` integer NOT NULL);
--> statement-breakpoint
CREATE TABLE `inquiries` (`id` text PRIMARY KEY NOT NULL, `name` text NOT NULL, `email` text NOT NULL, `interest` text NOT NULL DEFAULT '', `market` text NOT NULL DEFAULT '', `message` text NOT NULL, `status` text NOT NULL DEFAULT 'New', `owner` text NOT NULL DEFAULT '', `follow_up` text NOT NULL DEFAULT '', `created_at` integer NOT NULL, `updated_at` integer NOT NULL);
