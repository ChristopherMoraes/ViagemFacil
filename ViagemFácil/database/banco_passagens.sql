-- ============================================================
-- PROJETO: TOTEM DE AUTOATENDIMENTO - VIAGEM FACIL
-- CURSO: ANALISE E DESENVOLVIMENTO DE SISTEMAS (ADS)
-- ARQUIVO: banco_passagens.sql
-- DESCRICAO: DDL E CARGA INICIAL DO BANCO DE DADOS
-- SGBD: MySQL 8.0+ / MariaDB 10.4+
-- ============================================================

CREATE DATABASE IF NOT EXISTS `viagem_facil` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `viagem_facil`;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- TABELA: cidades
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `cidades`;
CREATE TABLE `cidades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sigla` varchar(5) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `estado` char(2) NOT NULL,
  `etiqueta` varchar(50) DEFAULT NULL,
  `imagem` varchar(255) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `criado_em` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sigla` (`sigla`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: empresas
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `empresas`;
CREATE TABLE `empresas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `razao_social` varchar(200) DEFAULT NULL,
  `cnpj` varchar(20) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `comissao_percent` decimal(5,2) DEFAULT 8.50,
  `situacao` enum('ATIVO','INATIVO') DEFAULT 'ATIVO',
  `criado_em` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: onibus
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `onibus`;
CREATE TABLE `onibus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `codigo_carro` varchar(30) NOT NULL,
  `placa` varchar(10) NOT NULL,
  `andares` tinyint(4) DEFAULT 2,
  `tipo` varchar(80) NOT NULL DEFAULT 'Double Decker',
  `total_poltronas` int(11) DEFAULT 48,
  `situacao` enum('ATIVO','MANUTENCAO','INATIVO') DEFAULT 'ATIVO',
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `onibus_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: rotas
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `rotas`;
CREATE TABLE `rotas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `onibus_id` int(11) DEFAULT NULL,
  `cidade_origem_id` int(11) NOT NULL,
  `cidade_destino_id` int(11) NOT NULL,
  `plataforma` varchar(30) DEFAULT 'Plataforma 12',
  `portao` varchar(20) DEFAULT 'Portão A',
  `dias_operacao` varchar(100) DEFAULT 'Seg,Ter,Qua,Qui,Sex,Sab,Dom',
  `situacao` enum('ATIVO','SUSPENSO','INATIVO') DEFAULT 'ATIVO',
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  KEY `onibus_id` (`onibus_id`),
  KEY `cidade_origem_id` (`cidade_origem_id`),
  KEY `cidade_destino_id` (`cidade_destino_id`),
  CONSTRAINT `rotas_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `rotas_ibfk_2` FOREIGN KEY (`onibus_id`) REFERENCES `onibus` (`id`) ON DELETE SET NULL,
  CONSTRAINT `rotas_ibfk_3` FOREIGN KEY (`cidade_origem_id`) REFERENCES `cidades` (`id`),
  CONSTRAINT `rotas_ibfk_4` FOREIGN KEY (`cidade_destino_id`) REFERENCES `cidades` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: horarios
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `horarios`;
CREATE TABLE `horarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rota_id` int(11) NOT NULL,
  `hora_saida` time NOT NULL,
  `hora_chegada` time NOT NULL,
  `duracao` varchar(15) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `rota_id` (`rota_id`),
  CONSTRAINT `horarios_ibfk_1` FOREIGN KEY (`rota_id`) REFERENCES `rotas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: servicos
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `servicos`;
CREATE TABLE `servicos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `descricao` text DEFAULT NULL,
  `preco` decimal(10,2) NOT NULL,
  `selo` varchar(30) DEFAULT NULL,
  `categoria` varchar(30) DEFAULT 'conforto',
  `ativo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: terminais
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `terminais`;
CREATE TABLE `terminais` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cidade_id` int(11) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `cidade_id` (`cidade_id`),
  CONSTRAINT `terminais_ibfk_1` FOREIGN KEY (`cidade_id`) REFERENCES `cidades` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: totens
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `totens`;
CREATE TABLE `totens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(30) NOT NULL,
  `terminal_id` int(11) DEFAULT NULL,
  `localizacao` varchar(150) DEFAULT NULL,
  `ip` varchar(20) DEFAULT NULL,
  `mac` varchar(20) DEFAULT NULL,
  `serial_impressora` varchar(30) DEFAULT NULL,
  `situacao` enum('ONLINE','OFFLINE') DEFAULT 'ONLINE',
  `nivel_papel` tinyint(4) DEFAULT 100,
  `leitor_cartao` enum('OK','ERRO') DEFAULT 'OK',
  `sincronizacao_antt` enum('OK','ERRO') DEFAULT 'OK',
  `vendas_hoje` int(11) DEFAULT 0,
  `faturamento_hoje` decimal(10,2) DEFAULT 0.00,
  `instalado_em` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `terminal_id` (`terminal_id`),
  CONSTRAINT `totens_ibfk_1` FOREIGN KEY (`terminal_id`) REFERENCES `terminais` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: cupons
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `cupons`;
CREATE TABLE `cupons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) NOT NULL,
  `tipo` enum('percentual','fixo') NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `descricao` varchar(100) DEFAULT NULL,
  `uso_maximo` int(11) DEFAULT NULL,
  `usos_realizados` int(11) DEFAULT 0,
  `valido_ate` date DEFAULT NULL,
  `usado` tinyint(1) DEFAULT 0,
  `status` enum('DISPONIVEL','USADO','EXPIRADO','INATIVO') DEFAULT 'DISPONIVEL',
  `ativo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: passageiros
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `passageiros`;
CREATE TABLE `passageiros` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome_completo` varchar(150) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `telefone` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `tipo_documento` varchar(10) DEFAULT 'RG',
  `numero_documento` varchar(30) DEFAULT NULL,
  `criado_em` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_cpf` (`cpf`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: usuarios
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `perfil` enum('ADMIN','OPERADOR') DEFAULT 'ADMIN',
  `ativo` tinyint(1) DEFAULT 1,
  `criado_em` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario` (`usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: vendas
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `vendas`;
CREATE TABLE `vendas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `localizador` varchar(20) NOT NULL,
  `passageiro_id` int(11) NOT NULL,
  `horario_id` int(11) NOT NULL,
  `data_viagem` date NOT NULL,
  `cupom_id` int(11) DEFAULT NULL,
  `desconto` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `totem_id` int(11) DEFAULT NULL,
  `situacao` enum('CONCLUIDA','PENDENTE','CANCELADA','ESTORNADA') DEFAULT 'PENDENTE',
  `criado_em` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `localizador` (`localizador`),
  KEY `passageiro_id` (`passageiro_id`),
  KEY `horario_id` (`horario_id`),
  KEY `cupom_id` (`cupom_id`),
  KEY `idx_localizador` (`localizador`),
  KEY `idx_data` (`data_viagem`),
  CONSTRAINT `vendas_ibfk_1` FOREIGN KEY (`passageiro_id`) REFERENCES `passageiros` (`id`),
  CONSTRAINT `vendas_ibfk_2` FOREIGN KEY (`horario_id`) REFERENCES `horarios` (`id`),
  CONSTRAINT `vendas_ibfk_3` FOREIGN KEY (`cupom_id`) REFERENCES `cupons` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: itens_venda
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `itens_venda`;
CREATE TABLE `itens_venda` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `venda_id` int(11) NOT NULL,
  `poltrona_numero` int(11) NOT NULL,
  `andar` tinyint(4) DEFAULT 1,
  `tipo_poltrona` varchar(30) DEFAULT 'Semi-Leito',
  `preco_unitario` decimal(10,2) NOT NULL,
  `nome_passageiro` varchar(150) DEFAULT NULL,
  `cpf_passageiro` varchar(14) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `venda_id` (`venda_id`),
  CONSTRAINT `itens_venda_ibfk_1` FOREIGN KEY (`venda_id`) REFERENCES `vendas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: pagamentos
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pagamentos`;
CREATE TABLE `pagamentos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `venda_id` int(11) NOT NULL,
  `localizador` varchar(20) DEFAULT NULL,
  `totem_id` int(11) DEFAULT NULL,
  `metodo` enum('PIX','CREDITO','DEBITO') NOT NULL,
  `parcelas` tinyint(4) DEFAULT 1,
  `valor` decimal(10,2) NOT NULL,
  `id_transacao` varchar(60) DEFAULT NULL,
  `codigo_autorizacao` varchar(30) DEFAULT NULL,
  `id_mercadopago` varchar(60) DEFAULT NULL,
  `situacao` enum('APROVADO','PENDENTE','RECUSADO','ESTORNADO') DEFAULT 'PENDENTE',
  `pago_em` datetime DEFAULT NULL,
  `criado_em` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `venda_id` (`venda_id`),
  CONSTRAINT `pagamentos_ibfk_1` FOREIGN KEY (`venda_id`) REFERENCES `vendas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: servicos_venda
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `servicos_venda`;
CREATE TABLE `servicos_venda` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `venda_id` int(11) NOT NULL,
  `servico_id` int(11) NOT NULL,
  `preco` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `venda_id` (`venda_id`),
  KEY `servico_id` (`servico_id`),
  CONSTRAINT `servicos_venda_ibfk_1` FOREIGN KEY (`venda_id`) REFERENCES `vendas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `servicos_venda_ibfk_2` FOREIGN KEY (`servico_id`) REFERENCES `servicos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VIEW: vw_rotas
-- ============================================================
CREATE OR REPLACE VIEW `vw_rotas` AS
SELECT 
  `r`.`id` AS `rota_id`,
  `r`.`empresa_id` AS `empresa_id`,
  `e`.`nome` AS `empresa_nome`,
  `e`.`codigo` AS `empresa_codigo`,
  `r`.`cidade_origem_id` AS `cidade_origem_id`,
  `co`.`nome` AS `cidade_origem_nome`,
  `co`.`sigla` AS `cidade_origem_sigla`,
  `co`.`estado` AS `cidade_origem_uf`,
  `r`.`cidade_destino_id` AS `cidade_destino_id`,
  `cd`.`nome` AS `cidade_destino_nome`,
  `cd`.`sigla` AS `cidade_destino_sigla`,
  `cd`.`estado` AS `cidade_destino_uf`,
  `r`.`onibus_id` AS `onibus_id`,
  `o`.`codigo_carro` AS `codigo_carro`,
  `o`.`placa` AS `placa`,
  `r`.`plataforma` AS `plataforma`,
  `r`.`portao` AS `portao`,
  `r`.`dias_operacao` AS `dias_operacao`,
  `r`.`situacao` AS `situacao`,
  `h`.`hora_saida` AS `hora_saida`,
  `h`.`hora_chegada` AS `hora_chegada`,
  `h`.`duracao` AS `duracao`
FROM `rotas` `r`
JOIN `empresas` `e` ON `r`.`empresa_id` = `e`.`id`
JOIN `cidades` `co` ON `r`.`cidade_origem_id` = `co`.`id`
JOIN `cidades` `cd` ON `r`.`cidade_destino_id` = `cd`.`id`
LEFT JOIN `onibus` `o` ON `r`.`onibus_id` = `o`.`id`
LEFT JOIN `horarios` `h` ON `h`.`rota_id` = `r`.`id`;

-- ============================================================
-- CARGA INICIAL DE DADOS (SEEDS)
-- ============================================================

-- DADOS: cidades
INSERT INTO `cidades` (`id`, `sigla`, `nome`, `estado`, `etiqueta`, `imagem`, `ativo`, `criado_em`) VALUES
  (1,'sp','São Paulo','SP','Metrópole','./assets/compartilhados/img/sao_paulo.jpg',1,'2026-09-11 09:58:33'),
  (2,'rj','Rio de Janeiro','RJ','Mais Procurado','./assets/compartilhados/img/rio_de_janeiro.jpg',1,'2026-09-11 09:58:33'),
  (3,'cwb','Curitiba','PR','Capital Ecológica','./assets/compartilhados/img/curitiba.jpg',1,'2026-09-11 09:58:33'),
  (4,'bh','Belo Horizonte','MG','Gastronomia e Cultura','./assets/compartilhados/img/belo_horizonte.jpg',1,'2026-09-11 09:58:33'),
  (5,'fln','Florianópolis','SC','Ilha da Magia','./assets/compartilhados/img/florianopolis.jpg',1,'2026-09-11 09:58:33'),
  (6,'sts','Santos','SP','Litoral Paulista','./assets/compartilhados/img/santos.jpg',1,'2026-09-11 09:58:33'),
  (7,'ssa','Salvador','BA','História e Praias','./assets/compartilhados/img/salvador.jpg',1,'2026-09-11 09:58:33'),
  (8,'grm','Gramado','RS','Serra Gaúcha','./assets/compartilhados/img/gramado.jpg',1,'2026-09-11 09:58:33'),
  (9,'foz','Foz do Iguaçu','PR','Cataratas e Natureza','./assets/compartilhados/img/foz_do_iguacu.jpg',1,'2026-09-11 09:58:33'),
  (11,'tag','Taguatinga','DF',NULL,NULL,1,'2026-09-12 14:48:23'),
  (12,'joa','João Pessoa','PB',NULL,NULL,1,'2026-09-12 22:14:17');

-- DADOS: empresas
INSERT INTO `empresas` (`id`, `codigo`, `nome`, `razao_social`, `cnpj`, `telefone`, `email`, `comissao_percent`, `situacao`, `criado_em`) VALUES
  (1,'cometa','Viação Cometa','Viação Cometa S.A.','61.084.018/0001-03','0800 942 0030','atendimento@viacaocometa.com.br',8.50,'ATIVO','2026-09-11 09:58:33'),
  (2,'1001','Expresso 1001','Auto Viação 1001 Ltda.','30.070.793/0001-44','0800 941 3534','suporte@autoviacao1001.com.br',8.50,'ATIVO','2026-09-11 09:58:33'),
  (3,'catarinense','Catarinense','Auto Viação Catarinense Ltda.','82.646.680/0001-08','0800 470 470','contato@catarinense.net',8.50,'ATIVO','2026-09-11 09:58:33'),
  (4,'gontijo','Gontijo','Empresa Gontijo de Transportes S.A.','16.624.611/0001-40','0800 728 0044','sac@gontijo.com.br',8.50,'ATIVO','2026-09-11 09:58:33'),
  (5,'penha','Penha','Empresa de Ônibus Nossa Sra. da Penha S.A.','44.244.791/0001-72','0800 015 0015','atendimento@penha.com.br',8.50,'ATIVO','2026-09-11 09:58:33'),
  (8,'progresso','Viação Progresso','Auto Viação Progresso S.A.','12.456.326/0001-15','0800 700 8080','contato@viacaoprogresso.com.br',7.50,'ATIVO','2026-09-12 15:17:51'),
  (10,'real_expresso','Real Expresso','Real Expresso Ltda.','45.698.745/0001-01','0800 280 2000','atendimento@realexpresso.com.br',8.50,'ATIVO','2026-09-12 22:12:53');

-- DADOS: onibus
INSERT INTO `onibus` (`id`, `empresa_id`, `codigo_carro`, `placa`, `andares`, `tipo`, `total_poltronas`, `situacao`) VALUES
  (1,10,'Carro 5555','BRA-2E19',2,'Double Decker (Leito Cama VIP (180°) & Semi-Leito Panorâmico (135°))',48,'ATIVO'),
  (2,2,'Carro 3055','RIO-8F22',2,'Double Decker (Leito Cama VIP)',48,'ATIVO'),
  (3,3,'Carro 5050','CWB-4A90',2,'Double Decker (Leito & Semi-Leito)',48,'ATIVO'),
  (4,4,'Carro 9012','MGH-7B34',2,'Double Decker (Leito e Semi-Leito)',48,'ATIVO'),
  (5,5,'Carro 8840','FOZ-9C77',2,'Double Decker (Leito e Semi-Leito)',48,'ATIVO'),
  (6,1,'Carro 9900','DFB-5521',2,'Double Decker (Leito e Semi-Leito)',48,'ATIVO'),
  (7,1,'Carro 7700','TAG-1010',2,'Double Decker (Leito & Semi-Leito)',48,'ATIVO');

-- DADOS: rotas
INSERT INTO `rotas` (`id`, `empresa_id`, `onibus_id`, `cidade_origem_id`, `cidade_destino_id`, `plataforma`, `portao`, `dias_operacao`, `situacao`) VALUES
  (1,1,1,1,2,'Plataforma 12','Portão A','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (2,2,2,1,2,'Plataforma 15','Portão B','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (3,3,3,1,3,'Plataforma 08','Portão A','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (4,4,4,1,4,'Plataforma 14','Portão C','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (5,1,5,1,9,'Plataforma 21','Portão D','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (6,3,3,1,8,'Plataforma 19','Portão C','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (7,1,1,1,6,'Plataforma 03','Portão A','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (8,8,6,1,11,'Plataforma 10','Portão D','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (9,3,3,1,3,'Plataforma 08','Portão B','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (10,8,7,11,5,'Plataforma 02','Portão B','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (11,8,1,11,2,'Plataforma 01','Portão A','Seg,Qua,Sex','ATIVO'),
  (12,8,1,11,9,'Plataforma 01','Portão A','Seg,Ter,Qua,Qui,Sex,Sáb,Dom','ATIVO'),
  (13,8,1,11,2,'Plataforma 01','Portão A','Seg,Ter,Qua,Qui,Sex,Sáb,Dom','ATIVO'),
  (14,8,1,11,1,'Plataforma 03','Portão B','Seg,Ter,Qua,Qui,Sex,Sáb,Dom','ATIVO'),
  (15,8,1,11,7,'Plataforma 01','Portão A','Seg,Ter,Qua,Qui,Sex','ATIVO'),
  (16,10,1,12,11,'Plataforma 06','Portão C','Seg,Ter,Qua,Qui,Sex,Sáb,Dom','ATIVO'),
  (17,2,2,2,1,'Plataforma 12','Portão A','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (18,1,1,2,4,'Plataforma 15','Portão B','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (19,3,3,2,3,'Plataforma 08','Portão A','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (20,2,2,2,6,'Plataforma 04','Portão C','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (21,3,3,3,1,'Plataforma 08','Portão A','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (22,3,3,3,5,'Plataforma 05','Portão B','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (23,5,5,3,9,'Plataforma 21','Portão C','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (24,2,2,3,2,'Plataforma 14','Portão D','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (25,4,4,4,1,'Plataforma 14','Portão C','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (26,1,1,4,2,'Plataforma 11','Portão B','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (27,4,4,4,7,'Plataforma 26','Portão D','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (28,4,4,4,3,'Plataforma 07','Portão A','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (29,3,3,5,1,'Plataforma 19','Portão D','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (30,3,3,5,3,'Plataforma 09','Portão A','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (31,5,5,5,8,'Plataforma 22','Portão D','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (32,1,1,5,6,'Plataforma 03','Portão A','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (33,1,1,6,1,'Plataforma 03','Portão A','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (34,3,3,6,3,'Plataforma 08','Portão A','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (35,2,2,6,2,'Plataforma 15','Portão B','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (36,1,1,6,5,'Plataforma 19','Portão D','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (37,4,4,7,1,'Plataforma 26','Portão D','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (38,4,4,7,4,'Plataforma 14','Portão C','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (39,2,2,7,2,'Plataforma 18','Portão B','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (40,4,4,7,11,'Plataforma 21','Portão A','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (41,5,5,8,5,'Plataforma 22','Portão D','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (42,3,3,8,3,'Plataforma 08','Portão A','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (43,4,4,8,1,'Plataforma 12','Portão A','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (44,5,5,8,9,'Plataforma 21','Portão C','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (45,3,3,9,3,'Plataforma 21','Portão C','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (46,1,1,9,1,'Plataforma 11','Portão B','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (47,5,5,9,5,'Plataforma 19','Portão D','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (48,5,5,9,8,'Plataforma 22','Portão D','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (49,4,4,12,7,'Plataforma 02','Portão A','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (50,4,4,12,11,'Plataforma 03','Portão B','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO'),
  (51,4,4,12,1,'Plataforma 01','Portão A','Seg,Ter,Qua,Qui,Sex,Sab,Dom','ATIVO');

-- DADOS: horarios
INSERT INTO `horarios` (`id`, `rota_id`, `hora_saida`, `hora_chegada`, `duracao`) VALUES
  (1,1,'06:00:00','11:45:00','5h 45m'),
  (2,1,'17:30:00','23:15:00','5h 45m'),
  (3,2,'08:30:00','14:00:00','5h 30m'),
  (4,2,'23:00:00','04:45:00','5h 45m'),
  (5,3,'11:15:00','16:45:00','5h 30m'),
  (6,4,'14:00:00','19:30:00','5h 30m'),
  (7,5,'20:30:00','10:00:00','13h 30m'),
  (8,6,'18:00:00','08:30:00','14h 30m'),
  (9,7,'09:00:00','10:15:00','1h 15m'),
  (10,8,'10:30:00','22:45:00','12h15'),
  (11,9,'07:30:00','04:30:00','21h00'),
  (12,10,'11:00:00','23:30:00','12h30'),
  (13,11,'06:00:00','12:00:00','6h00'),
  (14,12,'07:30:00','05:00:00','21h30'),
  (15,13,'08:00:00','22:00:00','14h00'),
  (16,10,'18:30:00','07:00:00','12h30'),
  (17,10,'21:00:00','09:30:00','12h30'),
  (18,11,'18:00:00','08:00:00','14h00'),
  (19,11,'20:30:00','10:30:00','14h00'),
  (20,11,'23:15:00','13:15:00','14h00'),
  (21,12,'19:15:00','16:45:00','21h30'),
  (22,12,'22:00:00','19:30:00','21h30'),
  (23,13,'19:00:00','09:00:00','14h00'),
  (24,13,'22:30:00','12:30:00','14h00'),
  (25,8,'18:15:00','06:30:00','12h15'),
  (26,8,'21:45:00','10:00:00','12h15'),
  (27,14,'08:30:00','20:45:00','12h15'),
  (28,14,'18:45:00','07:00:00','12h15'),
  (29,14,'22:15:00','10:30:00','12h15'),
  (30,15,'15:00:00','06:30:00','15h30'),
  (31,16,'13:00:00','03:30:00','14h30'),
  (32,17,'07:00:00','12:30:00','5h 30m'),
  (33,17,'22:30:00','04:00:00','5h 30m'),
  (34,18,'08:30:00','15:15:00','6h 45m'),
  (35,19,'19:00:00','07:00:00','12h 00m'),
  (36,20,'21:00:00','04:15:00','7h 15m'),
  (37,21,'06:30:00','12:00:00','5h 30m'),
  (38,21,'18:00:00','23:30:00','5h 30m'),
  (39,22,'09:00:00','13:30:00','4h 30m'),
  (40,23,'21:30:00','06:30:00','9h 00m'),
  (41,24,'20:00:00','08:30:00','12h 30m'),
  (42,25,'08:00:00','13:45:00','5h 45m'),
  (43,25,'22:00:00','03:45:00','5h 45m'),
  (44,26,'09:30:00','16:00:00','6h 30m'),
  (45,27,'14:00:00','12:00:00','22h 00m'),
  (46,28,'19:00:00','09:00:00','14h 00m'),
  (47,29,'08:00:00','19:30:00','11h 30m'),
  (48,29,'20:30:00','08:00:00','11h 30m'),
  (49,30,'10:00:00','14:30:00','4h 30m'),
  (50,31,'13:30:00','20:00:00','6h 30m'),
  (51,32,'21:00:00','07:30:00','10h 30m'),
  (52,33,'06:00:00','07:15:00','1h 15m'),
  (53,33,'10:00:00','11:15:00','1h 15m'),
  (54,33,'16:00:00','17:15:00','1h 15m'),
  (55,34,'11:30:00','17:30:00','6h 00m'),
  (56,35,'22:00:00','05:30:00','7h 30m'),
  (57,36,'20:00:00','06:00:00','10h 00m'),
  (58,37,'08:00:00','14:00:00','30h 00m'),
  (59,38,'10:30:00','09:00:00','22h 30m'),
  (60,39,'12:00:00','16:00:00','28h 00m'),
  (61,40,'15:00:00','15:00:00','24h 00m'),
  (62,41,'08:30:00','15:00:00','6h 30m'),
  (63,42,'14:00:00','00:00:00','10h 00m'),
  (64,43,'18:00:00','08:30:00','14h 30m'),
  (65,44,'20:30:00','08:30:00','12h 00m'),
  (66,45,'08:00:00','17:00:00','9h 00m'),
  (67,45,'21:00:00','06:00:00','9h 00m'),
  (68,46,'19:30:00','09:00:00','13h 30m'),
  (69,47,'18:00:00','08:00:00','14h 00m'),
  (70,48,'17:00:00','05:00:00','12h 00m'),
  (71,49,'09:00:00','23:00:00','14h 00m'),
  (72,50,'12:30:00','20:30:00','32h 00m'),
  (73,51,'16:00:00','06:00:00','38h 00m');

-- DADOS: servicos
INSERT INTO `servicos` (`id`, `codigo`, `titulo`, `descricao`, `preco`, `selo`, `categoria`, `ativo`) VALUES
  (1,'seguro_total','Seguro Viagem Proteção Total','Cobertura médica até R$ 50.000, extravio de bagagem e assistência 24h.',14.90,'Recomendado','seguranca',1),
  (2,'bagagem_extra','Bagagem Adicional (Até 20kg)','Espaço no bagageiro inferior para mala extra com etiqueta rastreável.',29.90,NULL,'bagagem',1),
  (3,'kit_lanche','Kit Lanche Gourmet a Bordo','Sanduíche natural, cookie, barra de cereais e suco ou café.',18.50,NULL,'alimentacao',1),
  (4,'sala_vip','Embarque Prioritário + Sala VIP','Lounge climatizado com bebidas, poltronas relax e embarque preferencial.',24.00,'VIP','conforto',1),
  (5,'pet_cabine','Transporte Pet na Cabine','Cão ou gato (até 10kg) ao seu lado em caixa de transporte adequada.',59.90,'Pet Friendly','pet',1),
  (6,'wifi_stream','Wi-Fi 5G Streaming Ilimitado','Internet de alta velocidade durante 100% da viagem.',9.90,NULL,'conforto',1),
  (7,'reembolso_flex','Reembolso 100% Garantido','Cancele ou remarque até 1 hora antes sem multas.',12.50,'Garantia','seguranca',1);

-- DADOS: terminais
INSERT INTO `terminais` (`id`, `cidade_id`, `nome`, `endereco`, `ativo`) VALUES
  (1,1,'Terminal Rodoviário Tietê',NULL,1),
  (2,1,'Terminal Rodoviário Barra Funda',NULL,1),
  (3,2,'Rodoviária Novo Rio',NULL,1),
  (4,3,'Rodoferroviária de Curitiba',NULL,1),
  (5,4,'Terminal Rodoviário Gov. Israel Pinheiro',NULL,1),
  (6,5,'Terminal Rita Maria',NULL,1),
  (7,6,'Terminal Rodoviário do Valongo',NULL,1),
  (8,7,'Terminal Rodoviário de Salvador',NULL,1),
  (9,8,'Terminal Rodoviário de Gramado',NULL,1),
  (10,9,'Rodoviária Internacional de Foz',NULL,1),
  (12,11,'Terminal Rodoviário de Taguatinga',NULL,1),
  (13,12,'Rodoviaria Joao Pessoa',NULL,1);

-- DADOS: totens
INSERT INTO `totens` (`id`, `nome`, `terminal_id`, `localizacao`, `ip`, `mac`, `serial_impressora`, `situacao`, `nivel_papel`, `leitor_cartao`, `sincronizacao_antt`, `vendas_hoje`, `faturamento_hoje`, `instalado_em`) VALUES
  (1,'Totem #01',1,'Saguão Principal - Bilheteria 04','192.168.10.101',NULL,'PRT-TM-8829101','ONLINE',92,'OK','OK',16,3303.88,'2025-01-10'),
  (2,'Totem #02',1,'Mezanino de Embarque - Portão C','192.168.10.102',NULL,'PRT-TM-8829102','ONLINE',68,'OK','OK',12,2121.91,'2025-01-10'),
  (3,'Totem #03',2,'Entrada A - Catracas Norte','192.168.10.103',NULL,'PRT-TM-8829103','ONLINE',0,'OK','OK',15,2049.94,'2025-02-01'),
  (4,'Totem #04',1,'Saguão de Autoatendimento Rápido','192.168.10.104',NULL,'PRT-TM-8829104','ONLINE',94,'OK','OK',5,1248.50,'2025-03-15');

-- DADOS: cupons
INSERT INTO `cupons` (`id`, `codigo`, `tipo`, `valor`, `descricao`, `uso_maximo`, `usos_realizados`, `valido_ate`, `usado`, `status`, `ativo`) VALUES
  (1,'TOTEM10','percentual',10.00,'10% de Desconto para compras no Totem',NULL,1,NULL,0,'DISPONIVEL',1),
  (2,'PRIMEIRA','percentual',20.00,'R$ 20 de Desconto na Primeira Compra',NULL,0,NULL,0,'DISPONIVEL',1),
  (3,'VIP15','percentual',15.00,'15% de Desconto VIP',NULL,1,NULL,0,'DISPONIVEL',1),
  (4,'VIAJEJA','percentual',15.00,'R$ 15 de Desconto Promocional',NULL,1,NULL,0,'DISPONIVEL',1),
  (5,'DESCONTO10','percentual',10.00,'10% de Desconto Geral',NULL,0,NULL,0,'DISPONIVEL',1),
  (6,'PROMO20','percentual',20.00,'R$ 20 de Desconto Promocional',NULL,0,NULL,0,'DISPONIVEL',1),
  (7,'INAUGURACAO10','percentual',10.00,'10% de Desconto de Inauguração',NULL,0,'2026-12-31',0,'DISPONIVEL',1),
  (8,'FERIADO10','percentual',10.00,'10% de Desconto em Feriados',NULL,0,'2026-12-31',0,'DISPONIVEL',1),
  (9,'PRIMEIRA15','percentual',15.00,'Cupom de boas-vindas para novos passageiros no totem',NULL,0,'2026-12-31',0,'DISPONIVEL',1),
  (10,'ESTUDANTE20','percentual',20.00,'Desconto universitário e escolar mediante comprovante',NULL,1,'2026-12-31',0,'DISPONIVEL',1),
  (12,'VERAO10','percentual',10.00,'Desconto especial de Verão para viagens interestaduais',NULL,0,'2026-12-31',0,'DISPONIVEL',1),
  (13,'FIMDESEMANA5','percentual',5.00,'Desconto para viagens aos sábados e domingos',NULL,0,'2026-12-31',0,'DISPONIVEL',1),
  (211,'BRASILIA10','percentual',10.00,'Desconto especial para rotas do Distrito Federal',NULL,1,'2026-12-31',0,'DISPONIVEL',1),
  (420,'APP5','percentual',5.00,'5% de Desconto Promocional',NULL,0,'2026-12-31',0,'DISPONIVEL',1);

-- DADOS: passageiros
INSERT INTO `passageiros` (`id`, `nome_completo`, `cpf`, `telefone`, `email`, `data_nascimento`, `tipo_documento`, `numero_documento`, `criado_em`) VALUES
  (1,'Carlos Eduardo Silveira','128.491.820-44','(11) 98765-4321','carlos.silveira@email.com','1988-05-14','RG','34.891.029-X','2026-08-20 14:32:10'),
  (2,'Mariana Duarte Souza','239.502.918-12','(21) 99123-8844','mariana.duarte@gmail.com','1995-11-23','RG','28.192.401-7','2026-08-21 09:15:44'),
  (3,'Roberto Albuquerque Neto','450.912.384-77','(31) 98841-2299','roberto.neto@outlook.com','1982-03-08','RG','19.402.812-4','2026-08-22 17:40:02'),
  (4,'Beatriz Vasconcelos','331.442.889-01','(48) 99876-1122','beatriz.v@empresa.com.br','1990-09-17','CNH','04918294012','2026-08-23 11:05:30'),
  (5,'Fernando Henrique Rocha','556.778.990-23','(11) 97123-4567','fh.rocha@uol.com.br','1979-12-01','RG','22.391.849-1','2026-08-24 08:20:15'),
  (6,'Camila Rodrigues Neves','109.827.364-11','(11) 96543-2109','camila.neves@gmail.com','1993-07-29','RG','41.092.381-5','2026-08-25 10:12:00'),
  (7,'Thiago Alcantara Ramos','239.502.918-12','(41) 98877-6655','thiago.ramos@empresa.com.br','1987-04-18','RG','50.129.833-2','2026-08-25 11:30:15'),
  (8,'Bruna Vasconcelos Lima','450.912.384-77','(13) 99182-3344','bruna.vasconcelos@gmail.com','1996-08-05','RG','33.910.281-9','2026-08-25 14:22:40'),
  (9,'Marcio Azevedo Castro','331.442.889-01','(31) 97766-5544','marcio.castro@yahoo.com.br','1981-02-14','CNH','08273918201','2026-08-25 16:45:10'),
  (10,'Juliana Mendes Camargo','901.234.567-89','(13) 98112-9900','juliana.camargo@gmail.com','1992-10-12','RG','36.819.201-4','2026-08-25 17:10:05'),
  (11,'Larissa Ferreira Lima','999.888.777-66','(11) 98888-7777','larissa.lima@email.com','1994-06-15','RG','42.109.832-1','2026-09-11 17:33:42'),
  (12,'Christopher Moraes','123.456.789-09','(11) 98765-4321','christopher.moraes@email.com','1998-03-20','RG','52.819.201-3','2026-09-11 17:37:14'),
  (14,'Pedro Henrique Santos','123.456.785-55','(11) 98765-1122','pedro.santos@email.com','1991-10-05','RG','39.018.293-8','2026-09-12 12:11:49'),
  (15,'Mariana Silva Santos','987.654.321-00','(11) 97111-2233','mariana.silva@email.com','1997-04-12','RG','45.192.830-1','2026-09-12 12:11:49'),
  (16,'Lucas Gabriel Oliveira','456.789.012-34','(11) 98222-3344','lucas.oliveira@email.com','1992-08-30','RG','48.291.039-4','2026-09-12 12:11:49'),
  (17,'Beatriz Souza Lima','321.654.987-12','(21) 99333-4455','beatriz.souza@email.com','1996-01-25','RG','31.902.819-5','2026-09-12 12:11:49'),
  (18,'Patricia Gomes Ribeiro','123.456.789-00','(11) 99444-5566','patricia.ribeiro@email.com','1989-12-18','RG','27.182.930-6','2026-09-12 17:53:23'),
  (19,'André Luiz Martins','888.777.666-55','(11) 97555-6677','andre.martins@email.com','1985-07-22','RG','38.920.192-7','2026-09-12 18:16:30'),
  (20,'Francisco Botelho','145.236.980-85','(61) 96523-6666','francisco.botelho@email.com','1975-09-10','RG','18.291.029-2','2026-09-14 08:57:53'),
  (21,'Francisca Botelho','222.222.223-66','(61) 96523-7777','francisca.botelho@email.com','1978-02-14','RG','21.092.839-4','2026-09-14 08:57:53');

-- DADOS: usuarios
INSERT INTO `usuarios` (`id`, `nome`, `usuario`, `senha_hash`, `perfil`, `ativo`, `criado_em`) VALUES
  (1,'Administrador do Sistema','admin','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','ADMIN',1,'2026-09-11 09:58:33');

-- DADOS: vendas
INSERT INTO `vendas` (`id`, `localizador`, `passageiro_id`, `horario_id`, `data_viagem`, `cupom_id`, `desconto`, `total`, `totem_id`, `situacao`, `criado_em`) VALUES
  (2,'TTM-849201',7,5,'2026-09-12',NULL,0.00,135.00,1,'CONCLUIDA','2026-09-11 10:45:00'),
  (3,'TTM-771829',8,9,'2026-09-12',NULL,0.00,38.50,2,'CONCLUIDA','2026-09-11 11:20:00'),
  (5,'TTM-501934',4,4,'2026-09-13',NULL,0.00,169.90,1,'CONCLUIDA','2026-09-12 12:30:00'),
  (6,'TTM-492019',5,1,'2026-09-13',NULL,0.00,179.80,2,'CONCLUIDA','2026-09-12 13:10:00'),
  (7,'TTM-382910',10,9,'2026-09-13',NULL,0.00,38.50,3,'CONCLUIDA','2026-09-12 13:45:00'),
  (8,'TTM-291048',1,3,'2026-09-14',NULL,0.00,149.90,1,'CONCLUIDA','2026-09-13 14:15:00'),
  (10,'TTM-109281',3,8,'2026-09-14',NULL,0.00,149.90,3,'CONCLUIDA','2026-09-13 15:20:00'),
  (12,'TTM-275759',12,1,'2026-09-11',NULL,0.00,516.70,4,'CONCLUIDA','2026-09-11 17:37:14'),
  (13,'TTM-989606',12,1,'2026-09-11',1,13.98,125.82,4,'CONCLUIDA','2026-09-11 17:48:37'),
  (15,'TTM-882540',12,1,'2026-09-11',NULL,0.00,496.90,4,'CONCLUIDA','2026-09-11 22:16:53'),
  (16,'TTM-705397',12,1,'2026-09-11',NULL,72.44,651.96,4,'CONCLUIDA','2026-09-11 22:19:09'),
  (17,'TTM-903954',12,1,'2026-09-19',NULL,35.47,319.23,4,'CONCLUIDA','2026-09-11 23:17:09'),
  (18,'TTM-628701',12,1,'2026-09-13',NULL,0.00,213.20,4,'CONCLUIDA','2026-09-11 23:26:00'),
  (19,'TTM-805028',12,1,'2026-09-16',NULL,0.00,586.70,4,'CONCLUIDA','2026-09-12 00:37:26'),
  (20,'TTM-674794',12,1,'2026-09-12',NULL,0.00,194.70,4,'CONCLUIDA','2026-09-12 00:43:28'),
  (21,'TTM-699188',12,1,'2026-09-12',NULL,0.00,264.70,4,'CONCLUIDA','2026-09-12 00:49:16'),
  (22,'TTM-177415',12,8,'2026-09-12',3,19.49,110.41,4,'CONCLUIDA','2026-09-12 11:40:06'),
  (23,'TTM-821965',14,9,'2026-09-12',NULL,0.00,549.20,4,'CONCLUIDA','2026-09-12 12:11:49'),
  (24,'TTM-258221',12,1,'2026-09-12',NULL,0.00,824.40,4,'CONCLUIDA','2026-09-12 12:41:42'),
  (25,'TTM-949882',12,30,'2026-09-13',211,92.92,836.28,4,'CONCLUIDA','2026-09-12 17:45:08'),
  (28,'TTM-633831',12,7,'2026-09-12',4,115.38,653.82,4,'CONCLUIDA','2026-09-12 18:01:18'),
  (29,'TTM-853338',12,14,'2026-09-12',NULL,0.00,896.70,4,'CONCLUIDA','2026-09-12 18:06:11'),
  (30,'TTM-777888',11,1,'2026-09-12',NULL,0.00,120.00,4,'CONCLUIDA','2026-09-12 18:12:55'),
  (31,'TTM-999111',19,1,'2026-09-12',NULL,0.00,150.00,4,'CONCLUIDA','2026-09-12 18:16:30'),
  (32,'TTM-233629',12,31,'2026-09-13',10,105.84,423.36,4,'CONCLUIDA','2026-09-12 22:19:17'),
  (33,'TTM-898311',12,1,'2026-09-12',NULL,0.00,124.90,4,'CONCLUIDA','2026-09-12 22:21:17'),
  (34,'TTM-910596',12,1,'2026-09-14',NULL,0.00,419.40,4,'CONCLUIDA','2026-09-14 08:09:43'),
  (35,'TTM-208119',12,7,'2026-09-14',NULL,0.00,314.70,4,'CONCLUIDA','2026-09-14 08:13:00'),
  (36,'TTM-834762',20,5,'2026-09-14',NULL,0.00,259.70,4,'CONCLUIDA','2026-09-14 08:57:53'),
  (37,'TTM-549747',12,5,'2026-09-14',NULL,0.00,114.90,4,'CONCLUIDA','2026-09-14 08:58:50'),
  (82,'TTM-3C9705B4',9,14,'2026-09-10',8,15.99,227.81,1,'CONCLUIDA','2026-09-08 06:34:22'),
  (85,'TTM-EC5976B6',2,12,'2026-09-13',NULL,0.00,320.87,1,'CONCLUIDA','2026-09-11 18:27:46'),
  (90,'TTM-C140A9E9',1,64,'2026-09-14',NULL,0.00,114.90,1,'CONCLUIDA','2026-09-10 19:17:09');

-- DADOS: itens_venda
INSERT INTO `itens_venda` (`id`, `venda_id`, `poltrona_numero`, `andar`, `tipo_poltrona`, `preco_unitario`, `nome_passageiro`, `cpf_passageiro`) VALUES
  (3,2,21,1,'Semi-Leito',135.00,'Thiago Alcantara Ramos','239.502.918-12'),
  (4,3,9,1,'Semi-Leito',38.50,'Bruna Vasconcelos Lima','450.912.384-77'),
  (7,5,11,1,'Semi-Leito',169.90,'Beatriz Vasconcelos','331.442.889-01'),
  (8,6,15,1,'Semi-Leito',89.90,'Fernando Henrique Rocha','556.778.990-23'),
  (9,6,16,1,'Semi-Leito',89.90,'Fernando Henrique Rocha','556.778.990-23'),
  (10,7,14,1,'Semi-Leito',38.50,'Juliana Mendes Camargo','901.234.567-89'),
  (11,8,8,1,'Semi-Leito',149.90,'Carlos Eduardo Silveira','128.491.820-44'),
  (13,10,18,1,'Semi-Leito',149.90,'Roberto Albuquerque Neto','450.912.384-77'),
  (15,12,14,2,'Semi-Leito',129.18,'Christopher Moraes','123.456.789-09'),
  (16,12,13,2,'Semi-Leito',129.18,'Christopher Moraes','123.456.789-09'),
  (17,12,17,2,'Semi-Leito',129.18,'Christopher Moraes','123.456.789-09'),
  (18,12,18,2,'Semi-Leito',129.18,'Christopher Moraes','123.456.789-09'),
  (19,13,4,1,'Leito Cama',125.82,'Christopher Moraes','123.456.789-09'),
  (21,15,14,2,'Semi-Leito',248.45,'Christopher Moraes','123.456.789-09'),
  (22,15,13,2,'Semi-Leito',248.45,'Christopher Moraes','123.456.789-09'),
  (23,16,15,2,'Semi-Leito',162.99,'Christopher Moraes','123.456.789-09'),
  (24,16,16,2,'Semi-Leito',162.99,'Christopher Moraes','123.456.789-09'),
  (25,16,13,2,'Semi-Leito',162.99,'Christopher Moraes','123.456.789-09'),
  (26,16,14,2,'Semi-Leito',162.99,'Christopher Moraes','123.456.789-09'),
  (27,17,13,2,'Semi-Leito',159.62,'Christopher Moraes','123.456.789-09'),
  (28,17,14,2,'Semi-Leito',159.62,'Christopher Moraes','123.456.789-09'),
  (29,18,13,2,'Semi-Leito',106.60,'Christopher Moraes','123.456.789-09'),
  (30,18,14,2,'Semi-Leito',106.60,'Christopher Moraes','123.456.789-09'),
  (31,19,3,1,'Leito Cama',146.68,'Christopher Moraes','123.456.789-09'),
  (32,19,4,1,'Leito Cama',146.68,'Christopher Moraes','123.456.789-09'),
  (33,19,14,2,'Semi-Leito',146.68,'Christopher Moraes','123.456.789-09'),
  (34,19,13,2,'Semi-Leito',146.68,'Christopher Moraes','123.456.789-09'),
  (35,20,13,2,'Semi-Leito',97.35,'Christopher Moraes','123.456.789-09'),
  (36,20,14,2,'Semi-Leito',97.35,'Christopher Moraes','123.456.789-09'),
  (37,21,3,1,'Leito Cama',132.35,'Christopher Moraes','123.456.789-09'),
  (38,21,4,1,'Leito Cama',132.35,'Christopher Moraes','123.456.789-09'),
  (39,22,3,1,'Leito Cama',110.41,'Christopher Moraes','123.456.789-09'),
  (40,23,15,2,'Semi-Leito',137.30,'Christopher Moraes','123.456.785-55'),
  (41,23,16,2,'Semi-Leito',137.30,'Mariana Silva Santos','987.654.321-00'),
  (42,23,23,2,'Semi-Leito',137.30,'Lucas Gabriel Oliveira','456.789.012-34'),
  (43,23,24,2,'Semi-Leito',137.30,'Beatriz Souza Lima','321.654.987-12'),
  (44,24,3,1,'Leito Cama',206.10,'Christopher Moraes','123.456.789-09'),
  (45,24,4,1,'Leito Cama',206.10,'Christopher Moraes','123.456.789-09'),
  (46,24,12,1,'Leito Cama',206.10,'Christopher Moraess','123.456.789-09'),
  (47,24,11,1,'Leito Cama',206.10,'Christopher Moraesss','123.456.789-09'),
  (48,25,13,2,'Semi-Leito',209.07,'Christopher Moraes','123.456.789-09'),
  (49,25,14,2,'Semi-Leito',209.07,'Christopher Moraes','123.456.789-09'),
  (50,25,18,2,'Semi-Leito',209.07,'Christopher Moraess','123.456.789-09'),
  (51,25,17,2,'Semi-Leito',209.07,'Christopher Moraesss','123.456.789-09'),
  (52,28,14,2,'Semi-Leito',163.46,'Christopher Moraes','123.456.789-09'),
  (53,28,13,2,'Semi-Leito',163.46,'Christopher Moraes','123.456.789-09'),
  (54,28,18,2,'Semi-Leito',163.46,'Christopher Moraess','123.456.789-09'),
  (55,28,17,2,'Semi-Leito',163.46,'Christopher Moraesss','123.456.789-09'),
  (56,29,3,1,'Leito Cama',224.18,'Christopher Moraes','123.456.789-09'),
  (57,29,4,1,'Leito Cama',224.18,'Christopher Moraes','123.456.789-09'),
  (58,29,7,1,'Leito Cama',224.18,'Christopher Moraess','123.456.789-09'),
  (59,29,11,1,'Leito Cama',224.18,'Christopher Moraesss','123.456.789-09'),
  (60,32,13,2,'Semi-Leito',105.84,'Arnaldo César Coelho','123.456.789-09'),
  (61,32,14,2,'Semi-Leito',105.84,'Christopher Moraes','123.456.789-09'),
  (62,32,18,2,'Semi-Leito',105.84,'Christopher Moraess','123.456.789-09'),
  (63,32,17,2,'Semi-Leito',105.84,'Christopher Moraesss','123.456.789-09'),
  (64,33,3,1,'Leito Cama',124.90,'Christopher Moraes','123.456.789-09'),
  (65,34,4,1,'Leito Cama',209.70,'Christopher Moraesug','123.456.789-09'),
  (66,34,3,1,'Leito Cama',209.70,'Christopher Moraes','123.456.789-09'),
  (67,35,14,2,'Semi-Leito',157.35,'Christopher Moraes','123.456.789-09'),
  (68,35,13,2,'Semi-Leito',157.35,'Christopher Moraes','123.456.789-09'),
  (69,36,4,1,'Leito Cama',129.85,'Francisco Botelho','145.236.980-85'),
  (70,36,3,1,'Leito Cama',129.85,'Francisca Botelho','222.222.223-66'),
  (71,37,12,1,'Leito Cama',114.90,'Christopher Moraes','123.456.789-09'),
  (119,82,13,2,'Semi-Leito',159.90,'Marcio Azevedo Castro','331.442.889-01'),
  (122,85,10,1,'Leito Cama',296.87,'Mariana Duarte Souza','239.502.918-12'),
  (129,90,34,2,'Semi-Leito',85.00,'Carlos Eduardo Silveira','128.491.820-44');

-- DADOS: pagamentos
INSERT INTO `pagamentos` (`id`, `venda_id`, `localizador`, `totem_id`, `metodo`, `parcelas`, `valor`, `id_transacao`, `codigo_autorizacao`, `id_mercadopago`, `situacao`, `pago_em`, `criado_em`) VALUES
  (2,2,'TTM-849201',1,'CREDITO',1,135.00,'CC-849201992',NULL,NULL,'APROVADO','2026-09-11 10:45:00','2026-09-11 10:45:00'),
  (3,3,'TTM-771829',2,'PIX',1,38.50,'PIX-771829001',NULL,NULL,'APROVADO','2026-09-11 11:20:00','2026-09-11 11:20:00'),
  (5,5,'TTM-501934',1,'PIX',1,169.90,'PIX-501934882',NULL,NULL,'APROVADO','2026-09-11 12:30:00','2026-09-11 12:30:00'),
  (6,6,'TTM-492019',2,'CREDITO',1,179.80,'CC-492019330',NULL,NULL,'APROVADO','2026-09-11 13:10:00','2026-09-11 13:10:00'),
  (7,7,'TTM-382910',3,'PIX',1,38.50,'PIX-382910772',NULL,NULL,'APROVADO','2026-09-11 13:45:00','2026-09-11 13:45:00'),
  (8,8,'TTM-291048',1,'PIX',1,149.90,'PIX-291048119',NULL,NULL,'APROVADO','2026-09-11 14:15:00','2026-09-11 14:15:00'),
  (10,10,'TTM-109281',3,'PIX',1,149.90,'PIX-109281663',NULL,NULL,'APROVADO','2026-09-11 15:20:00','2026-09-11 15:20:00'),
  (12,12,'TTM-275759',4,'CREDITO',1,516.70,'MP-3678103828-7136ad32-d514-4730-a8e8-827cf4a88635','709422','3678103828-7136ad32-d514-4730-a8e8-827cf4a88635','APROVADO','2026-09-11 17:37:14','2026-09-11 17:37:14'),
  (13,13,'TTM-989606',4,'CREDITO',1,125.82,'MP-3678103828-7569d111-e469-4f03-a24e-c3ff077bfa9e','844579','3678103828-7569d111-e469-4f03-a24e-c3ff077bfa9e','APROVADO','2026-09-11 17:48:37','2026-09-11 17:48:37'),
  (15,15,'TTM-882540',4,'CREDITO',1,496.90,'MP-3678103828-4a8f7b0b-543e-49a7-87b3-7c4c2518147a','567770','3678103828-4a8f7b0b-543e-49a7-87b3-7c4c2518147a','APROVADO','2026-09-11 22:16:53','2026-09-11 22:16:53'),
  (16,16,'TTM-705397',4,'PIX',1,651.96,'MP-3678103828-82eb39e6-1d3e-430d-aadd-a88077cf0e6c','390310','3678103828-82eb39e6-1d3e-430d-aadd-a88077cf0e6c','APROVADO','2026-09-11 22:19:09','2026-09-11 22:19:09'),
  (17,17,'TTM-903954',4,'PIX',1,319.23,'MP-3678103828-72315c72-9a88-482c-9045-73a1bac87e5f','886001','3678103828-72315c72-9a88-482c-9045-73a1bac87e5f','APROVADO','2026-09-11 23:17:09','2026-09-11 23:17:09'),
  (18,18,'TTM-628701',4,'PIX',1,213.20,'MP-3678103828-c9779991-92bc-40b2-a2e1-efb1285f8e35','454470','3678103828-c9779991-92bc-40b2-a2e1-efb1285f8e35','APROVADO','2026-09-11 23:26:00','2026-09-11 23:26:00'),
  (19,19,'TTM-805028',4,'PIX',1,586.70,'MP-3678103828-1e253651-1463-4720-a6e4-2e22d8f76747','451463','3678103828-1e253651-1463-4720-a6e4-2e22d8f76747','APROVADO','2026-09-12 00:37:26','2026-09-12 00:37:26'),
  (20,20,'TTM-674794',4,'PIX',1,194.70,'MP-3678103828-5a8e0348-6914-4ef5-b107-e5a08a790767','381284','3678103828-5a8e0348-6914-4ef5-b107-e5a08a790767','APROVADO','2026-09-12 00:43:28','2026-09-12 00:43:28'),
  (21,21,'TTM-699188',4,'CREDITO',1,264.70,'MP-3678103828-e6d1e48d-c2ea-4929-85ae-3f16f26ea5c3','994216','3678103828-e6d1e48d-c2ea-4929-85ae-3f16f26ea5c3','APROVADO','2026-09-12 00:49:16','2026-09-12 00:49:16'),
  (22,22,'TTM-177415',4,'DEBITO',1,110.41,'MP-3678103828-7b7e37e7-8971-4f67-a548-11fcfab5e76c','962810','3678103828-7b7e37e7-8971-4f67-a548-11fcfab5e76c','APROVADO','2026-09-12 11:40:06','2026-09-12 11:40:06'),
  (23,23,'TTM-821965',4,'CREDITO',1,549.20,'MP-3678103828-43d4b9e8-7d21-4b57-ba42-8d4a9f40569c','436085','3678103828-43d4b9e8-7d21-4b57-ba42-8d4a9f40569c','APROVADO','2026-09-12 12:11:49','2026-09-12 12:11:49'),
  (24,24,'TTM-258221',4,'PIX',1,824.40,'MP-3678103828-f9ff32c6-2e3a-4c8b-a31b-962862858ab4','331603','3678103828-f9ff32c6-2e3a-4c8b-a31b-962862858ab4','APROVADO','2026-09-12 12:41:42','2026-09-12 12:41:42'),
  (25,25,'TTM-949882',4,'DEBITO',1,836.28,'MP-3678103828-720ed817-d927-4480-be8f-c0a0ccd5fb32','346791','3678103828-720ed817-d927-4480-be8f-c0a0ccd5fb32','APROVADO','2026-09-12 17:45:08','2026-09-12 17:45:08'),
  (28,28,'TTM-633831',4,'CREDITO',6,653.82,'MP-3678103828-34cc96cf-33b7-4053-b70d-5f817b38a5ab','524537','3678103828-34cc96cf-33b7-4053-b70d-5f817b38a5ab','APROVADO','2026-09-12 18:01:18','2026-09-12 18:01:18'),
  (29,29,'TTM-853338',4,'CREDITO',6,896.70,'MP-3678103828-1234083c-fab4-4532-bf8d-c7c60681b144','286125','3678103828-1234083c-fab4-4532-bf8d-c7c60681b144','APROVADO','2026-09-12 18:06:11','2026-09-12 18:06:11'),
  (30,30,'TTM-777888',4,'CREDITO',2,120.00,'MP-3678103828-testeloc-1234','AUTH-927289','3678103828-testeloc-1234','APROVADO','2026-09-12 18:12:55','2026-09-12 18:12:55'),
  (31,31,'TTM-999111',4,'CREDITO',4,150.00,'MP-3678103828-totem-val-99','AUTH-278084','3678103828-totem-val-99','APROVADO','2026-09-12 18:16:30','2026-09-12 18:16:30'),
  (32,32,'TTM-233629',4,'PIX',1,423.36,'MP-3678103828-c5ba477f-345e-4673-ae38-7eadded0687d','945170','3678103828-c5ba477f-345e-4673-ae38-7eadded0687d','APROVADO','2026-09-12 22:19:17','2026-09-12 22:19:17'),
  (33,33,'TTM-898311',4,'CREDITO',6,124.90,'MP-3678103828-8b52a0cc-1b80-4bec-b959-02f9135ead98','907126','3678103828-8b52a0cc-1b80-4bec-b959-02f9135ead98','APROVADO','2026-09-12 22:21:17','2026-09-12 22:21:17'),
  (34,34,'TTM-910596',4,'PIX',1,419.40,'MP-3678103828-36febf7a-0ddc-47cf-869c-f6fcdc428877','888834','3678103828-36febf7a-0ddc-47cf-869c-f6fcdc428877','APROVADO','2026-09-14 08:09:43','2026-09-14 08:09:43'),
  (35,35,'TTM-208119',4,'DEBITO',1,314.70,'MP-3678103828-4be790d6-208b-453d-a1f9-ce61376addac','101323','3678103828-4be790d6-208b-453d-a1f9-ce61376addac','APROVADO','2026-09-14 08:13:00','2026-09-14 08:13:00'),
  (36,36,'TTM-834762',4,'PIX',1,259.70,'MP-3678103828-204651bf-a939-4cbb-bb08-16f4f0f2e013','163601','3678103828-204651bf-a939-4cbb-bb08-16f4f0f2e013','APROVADO','2026-09-14 08:57:53','2026-09-14 08:57:53'),
  (37,37,'TTM-549747',4,'CREDITO',6,114.90,'MP-3678103828-f58fba73-342a-4fc8-bcdb-adc7e6a29952','948628','3678103828-f58fba73-342a-4fc8-bcdb-adc7e6a29952','APROVADO','2026-09-14 08:58:50','2026-09-14 08:58:50'),
  (82,82,'TTM-3C9705B4',1,'PIX',1,227.81,'PAY-82E01D174292','825FD8',NULL,'APROVADO','2026-09-08 06:34:22','2026-09-08 06:34:22'),
  (85,85,'TTM-EC5976B6',1,'PIX',1,320.87,'PAY-F7D1ACFFD77A','E0A4FA',NULL,'APROVADO','2026-09-11 18:27:46','2026-09-11 18:27:46'),
  (90,90,'TTM-C140A9E9',1,'PIX',1,114.90,'PAY-BAF447A39956','BA2779',NULL,'APROVADO','2026-09-10 19:17:09','2026-09-10 19:17:09');

-- DADOS: servicos_venda
INSERT INTO `servicos_venda` (`id`, `venda_id`, `servico_id`, `preco_cobrado`) VALUES
  (3,82,4,24.00),
  (4,82,5,59.90),
  (5,85,4,24.00),
  (7,90,2,29.90);

SET FOREIGN_KEY_CHECKS = 1;
