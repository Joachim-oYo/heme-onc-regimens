CREATE TABLE "cells" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"parent_id" text,
	"lineage" text,
	"order" integer
);
--> statement-breakpoint
CREATE TABLE "disease_cells" (
	"disease_id" text NOT NULL,
	"cell_id" text NOT NULL,
	CONSTRAINT "disease_cells_disease_id_cell_id_pk" PRIMARY KEY("disease_id","cell_id")
);
--> statement-breakpoint
CREATE TABLE "diseases" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"abbreviation" text
);
--> statement-breakpoint
CREATE TABLE "drug_regimens" (
	"drug_id" text NOT NULL,
	"regimen_id" text NOT NULL,
	CONSTRAINT "drug_regimens_drug_id_regimen_id_pk" PRIMARY KEY("drug_id","regimen_id")
);
--> statement-breakpoint
CREATE TABLE "drugs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"mechanism" text DEFAULT '' NOT NULL,
	"toxicities" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regimen_diseases" (
	"regimen_id" text NOT NULL,
	"disease_id" text NOT NULL,
	CONSTRAINT "regimen_diseases_regimen_id_disease_id_pk" PRIMARY KEY("regimen_id","disease_id")
);
--> statement-breakpoint
CREATE TABLE "regimens" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cells" ADD CONSTRAINT "cells_parent_id_cells_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cells"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disease_cells" ADD CONSTRAINT "disease_cells_disease_id_diseases_id_fk" FOREIGN KEY ("disease_id") REFERENCES "public"."diseases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disease_cells" ADD CONSTRAINT "disease_cells_cell_id_cells_id_fk" FOREIGN KEY ("cell_id") REFERENCES "public"."cells"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drug_regimens" ADD CONSTRAINT "drug_regimens_drug_id_drugs_id_fk" FOREIGN KEY ("drug_id") REFERENCES "public"."drugs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drug_regimens" ADD CONSTRAINT "drug_regimens_regimen_id_regimens_id_fk" FOREIGN KEY ("regimen_id") REFERENCES "public"."regimens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regimen_diseases" ADD CONSTRAINT "regimen_diseases_regimen_id_regimens_id_fk" FOREIGN KEY ("regimen_id") REFERENCES "public"."regimens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regimen_diseases" ADD CONSTRAINT "regimen_diseases_disease_id_diseases_id_fk" FOREIGN KEY ("disease_id") REFERENCES "public"."diseases"("id") ON DELETE cascade ON UPDATE no action;