CREATE TABLE `candidate_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidatoSequencial` varchar(20) NOT NULL,
	`candidatoNome` varchar(200) NOT NULL,
	`candidatoNomeUrna` varchar(100),
	`candidatoNumero` varchar(10),
	`partidoSigla` varchar(20) NOT NULL,
	`uf` varchar(2) NOT NULL,
	`cargo` varchar(50) NOT NULL,
	`ano` smallint NOT NULL,
	`turno` tinyint NOT NULL DEFAULT 1,
	`totalVotos` bigint NOT NULL DEFAULT 0,
	`totalVotosPartido` bigint DEFAULT 0,
	`percentualSobrePartido` decimal(8,4),
	`percentualSobreValidos` decimal(8,4),
	`situacao` varchar(100),
	`eleito` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `candidate_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidate_zone_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidatoSequencial` varchar(20) NOT NULL,
	`candidatoNome` varchar(200) NOT NULL,
	`candidatoNomeUrna` varchar(100),
	`partidoSigla` varchar(20) NOT NULL,
	`uf` varchar(2) NOT NULL,
	`codigoMunicipio` varchar(10),
	`nomeMunicipio` varchar(200),
	`numeroZona` varchar(10) NOT NULL,
	`cargo` varchar(50) NOT NULL,
	`ano` smallint NOT NULL,
	`turno` tinyint NOT NULL DEFAULT 1,
	`totalVotos` bigint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `candidate_zone_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `candidates` ADD `turno` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `candidates` ADD `eleito` boolean DEFAULT false;--> statement-breakpoint
CREATE INDEX `idx_cand_results_partido_uf` ON `candidate_results` (`partidoSigla`,`uf`);--> statement-breakpoint
CREATE INDEX `idx_cand_results_ano_cargo` ON `candidate_results` (`ano`,`cargo`);--> statement-breakpoint
CREATE INDEX `idx_cand_results_seq` ON `candidate_results` (`candidatoSequencial`);--> statement-breakpoint
CREATE INDEX `idx_cand_results_uf_ano` ON `candidate_results` (`uf`,`ano`);--> statement-breakpoint
CREATE INDEX `idx_zone_cand_seq` ON `candidate_zone_results` (`candidatoSequencial`);--> statement-breakpoint
CREATE INDEX `idx_zone_cand_uf_ano` ON `candidate_zone_results` (`uf`,`ano`);--> statement-breakpoint
CREATE INDEX `idx_zone_cand_partido` ON `candidate_zone_results` (`partidoSigla`);--> statement-breakpoint
CREATE INDEX `idx_zone_cand_municipio` ON `candidate_zone_results` (`codigoMunicipio`);--> statement-breakpoint
CREATE INDEX `idx_candidates_seq` ON `candidates` (`sequencial`);--> statement-breakpoint
ALTER TABLE `election_results_by_municipality` DROP COLUMN `candidatoNome`;--> statement-breakpoint
ALTER TABLE `election_results_by_municipality` DROP COLUMN `candidatoSequencial`;--> statement-breakpoint
ALTER TABLE `election_results_by_uf` DROP COLUMN `candidatoNome`;--> statement-breakpoint
ALTER TABLE `election_results_by_uf` DROP COLUMN `candidatoSequencial`;