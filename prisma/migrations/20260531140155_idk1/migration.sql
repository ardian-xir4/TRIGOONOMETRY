/*
  Warnings:

  - You are about to drop the `_projecttotag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_projecttotag` DROP FOREIGN KEY `_ProjectToTag_A_fkey`;

-- DropForeignKey
ALTER TABLE `_projecttotag` DROP FOREIGN KEY `_ProjectToTag_B_fkey`;

-- AlterTable
ALTER TABLE `project` ADD COLUMN `imageUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `wallet` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- DropTable
DROP TABLE `_projecttotag`;

-- DropTable
DROP TABLE `tag`;

-- CreateTable
CREATE TABLE `PartListing` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
