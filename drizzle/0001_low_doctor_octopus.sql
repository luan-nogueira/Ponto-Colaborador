CREATE TABLE `configuracoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hora_entrada` varchar(5),
	`hora_saida` varchar(5),
	`hora_intervalo_inicio` varchar(5),
	`hora_intervalo_fim` varchar(5),
	`duracao_intervalo_minutos` int DEFAULT 60,
	`tolerancia_atraso_minutos` int DEFAULT 5,
	`raio_permitido_metros` int DEFAULT 100,
	`latitude_empresa` decimal(10,8),
	`longitude_empresa` decimal(11,8),
	`feriados` text,
	`dias_uteis` varchar(20),
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `configuracoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `justificativas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int NOT NULL,
	`tipo` enum('esquecimento_ponto','atraso','saida_antecipada','outro') NOT NULL,
	`descricao` text NOT NULL,
	`data_evento` datetime NOT NULL,
	`status` enum('pendente','aprovada','rejeitada') NOT NULL DEFAULT 'pendente',
	`comentario_gestor` text,
	`analisado_por_id` int,
	`data_analise` timestamp,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `justificativas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ponto_registros` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int NOT NULL,
	`tipo` enum('entrada','saida','intervalo_inicio','intervalo_fim') NOT NULL,
	`data_registro` datetime NOT NULL,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`precisao` decimal(10,2),
	`endereco` text,
	`dispositivo` varchar(255),
	`observacao` text,
	`status` enum('confirmado','pendente','rejeitado') NOT NULL DEFAULT 'confirmado',
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ponto_registros_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resumo_diario` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int NOT NULL,
	`data` datetime NOT NULL,
	`entrada` datetime,
	`saida` datetime,
	`intervalo_inicio` datetime,
	`intervalo_fim` datetime,
	`horas_trabalhadas` decimal(5,2),
	`horas_intervalo` decimal(5,2),
	`atraso_minutos` int,
	`status` enum('presente','ausente','atrasado','saida_antecipada') NOT NULL,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resumo_diario_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resumo_mensal` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int NOT NULL,
	`mes` int NOT NULL,
	`ano` int NOT NULL,
	`dias_trabalhados` int DEFAULT 0,
	`atrasos` int DEFAULT 0,
	`faltas` int DEFAULT 0,
	`saidas_antecipadas` int DEFAULT 0,
	`horas_trabalhadas` decimal(8,2) DEFAULT 0,
	`horas_extras` decimal(8,2) DEFAULT 0,
	`horas_intervalo` decimal(8,2) DEFAULT 0,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resumo_mensal_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unidades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`endereco` text,
	`latitude` decimal(10,8) NOT NULL,
	`longitude` decimal(11,8) NOT NULL,
	`raio_metros` int DEFAULT 100,
	`ativa` boolean NOT NULL DEFAULT true,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	`atualizado_em` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unidades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','gestor','colaborador') NOT NULL DEFAULT 'colaborador';--> statement-breakpoint
ALTER TABLE `users` ADD `cargo` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `setor` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `numeroMatricula` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `ativo` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_numeroMatricula_unique` UNIQUE(`numeroMatricula`);