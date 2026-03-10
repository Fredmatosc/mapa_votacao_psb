CREATE TABLE `electoral_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` varchar(10) NOT NULL,
	`uf` varchar(2) NOT NULL,
	`numeroZona` varchar(10) NOT NULL,
	`nomeMunicipio` varchar(200),
	`bairro` varchar(200),
	`endereco` text,
	`cep` varchar(10),
	`municipioId` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `electoral_zones_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_electoral_zones_zone_id` UNIQUE(`zoneId`)
);
--> statement-breakpoint
CREATE INDEX `idx_electoral_zones_uf_zona` ON `electoral_zones` (`uf`,`numeroZona`);