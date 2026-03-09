CREATE TABLE `candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequencial` varchar(20),
	`nome` varchar(200) NOT NULL,
	`nomeUrna` varchar(100),
	`numero` varchar(10),
	`partidoSigla` varchar(20),
	`uf` varchar(2),
	`cargo` varchar(50),
	`ano` smallint NOT NULL,
	`situacao` varchar(100),
	`genero` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `candidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `election_results_by_municipality` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ano` smallint NOT NULL,
	`turno` tinyint NOT NULL,
	`uf` varchar(2) NOT NULL,
	`codigoMunicipio` varchar(10) NOT NULL,
	`nomeMunicipio` varchar(200) NOT NULL,
	`cargo` varchar(50) NOT NULL,
	`partidoSigla` varchar(20) NOT NULL,
	`candidatoNome` varchar(200),
	`candidatoSequencial` varchar(20),
	`totalVotos` bigint NOT NULL DEFAULT 0,
	`totalVotosBranco` bigint DEFAULT 0,
	`totalVotosNulos` bigint DEFAULT 0,
	`totalVotosValidos` bigint DEFAULT 0,
	`percentualVotos` decimal(8,4),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `election_results_by_municipality_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `election_results_by_uf` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ano` smallint NOT NULL,
	`turno` tinyint NOT NULL,
	`uf` varchar(2) NOT NULL,
	`cargo` varchar(50) NOT NULL,
	`partidoSigla` varchar(20) NOT NULL,
	`candidatoNome` varchar(200),
	`candidatoSequencial` varchar(20),
	`totalVotos` bigint NOT NULL DEFAULT 0,
	`totalVotosBranco` bigint DEFAULT 0,
	`totalVotosNulos` bigint DEFAULT 0,
	`totalVotosValidos` bigint DEFAULT 0,
	`totalComparecimento` bigint DEFAULT 0,
	`totalAbstencoes` bigint DEFAULT 0,
	`percentualVotos` decimal(8,4),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `election_results_by_uf_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `election_results_by_zone` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ano` smallint NOT NULL,
	`turno` tinyint NOT NULL,
	`uf` varchar(2) NOT NULL,
	`codigoMunicipio` varchar(10) NOT NULL,
	`nomeMunicipio` varchar(200),
	`numeroZona` varchar(10) NOT NULL,
	`cargo` varchar(50) NOT NULL,
	`partidoSigla` varchar(20) NOT NULL,
	`candidatoNome` varchar(200),
	`totalVotos` bigint NOT NULL DEFAULT 0,
	`percentualVotos` decimal(8,4),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `election_results_by_zone_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `election_summary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ano` smallint NOT NULL,
	`turno` tinyint NOT NULL,
	`uf` varchar(2),
	`cargo` varchar(50) NOT NULL,
	`totalEleitores` bigint DEFAULT 0,
	`totalComparecimento` bigint DEFAULT 0,
	`totalAbstencoes` bigint DEFAULT 0,
	`totalVotosBranco` bigint DEFAULT 0,
	`totalVotosNulos` bigint DEFAULT 0,
	`totalVotosValidos` bigint DEFAULT 0,
	`percentualComparecimento` decimal(8,4),
	`percentualAbstencao` decimal(8,4),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `election_summary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `municipalities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigoIbge` varchar(10) NOT NULL,
	`nome` varchar(200) NOT NULL,
	`uf` varchar(2) NOT NULL,
	`regiao` varchar(20),
	`lat` decimal(10,7),
	`lng` decimal(10,7),
	CONSTRAINT `municipalities_id` PRIMARY KEY(`id`),
	CONSTRAINT `municipalities_codigoIbge_unique` UNIQUE(`codigoIbge`)
);
--> statement-breakpoint
CREATE TABLE `parties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sigla` varchar(20) NOT NULL,
	`nome` varchar(200) NOT NULL,
	`numero` smallint,
	`cor` varchar(7) DEFAULT '#888888',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parties_id` PRIMARY KEY(`id`),
	CONSTRAINT `parties_sigla_unique` UNIQUE(`sigla`)
);
--> statement-breakpoint
CREATE INDEX `idx_candidates_partido` ON `candidates` (`partidoSigla`);--> statement-breakpoint
CREATE INDEX `idx_candidates_uf_ano` ON `candidates` (`uf`,`ano`);--> statement-breakpoint
CREATE INDEX `idx_candidates_nome` ON `candidates` (`nome`);--> statement-breakpoint
CREATE INDEX `idx_mun_results_ano_turno` ON `election_results_by_municipality` (`ano`,`turno`);--> statement-breakpoint
CREATE INDEX `idx_mun_results_uf` ON `election_results_by_municipality` (`uf`);--> statement-breakpoint
CREATE INDEX `idx_mun_results_partido` ON `election_results_by_municipality` (`partidoSigla`);--> statement-breakpoint
CREATE INDEX `idx_mun_results_cargo` ON `election_results_by_municipality` (`cargo`);--> statement-breakpoint
CREATE INDEX `idx_mun_results_municipio` ON `election_results_by_municipality` (`codigoMunicipio`);--> statement-breakpoint
CREATE INDEX `idx_uf_results_ano_turno` ON `election_results_by_uf` (`ano`,`turno`);--> statement-breakpoint
CREATE INDEX `idx_uf_results_uf` ON `election_results_by_uf` (`uf`);--> statement-breakpoint
CREATE INDEX `idx_uf_results_partido` ON `election_results_by_uf` (`partidoSigla`);--> statement-breakpoint
CREATE INDEX `idx_uf_results_cargo` ON `election_results_by_uf` (`cargo`);--> statement-breakpoint
CREATE INDEX `idx_zone_results_ano_uf` ON `election_results_by_zone` (`ano`,`uf`);--> statement-breakpoint
CREATE INDEX `idx_zone_results_partido` ON `election_results_by_zone` (`partidoSigla`);--> statement-breakpoint
CREATE INDEX `idx_summary_ano_turno` ON `election_summary` (`ano`,`turno`);--> statement-breakpoint
CREATE INDEX `idx_summary_uf` ON `election_summary` (`uf`);--> statement-breakpoint
CREATE INDEX `idx_municipalities_uf` ON `municipalities` (`uf`);