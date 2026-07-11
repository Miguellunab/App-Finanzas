DO $$
DECLARE
	expected record;
	actual_type text;
	actual_nullable boolean;
	row_count bigint;
	constraint_definition text;
BEGIN
	IF to_regclass('public.wallets') IS NULL OR to_regclass('public.transactions') IS NULL THEN
		RAISE EXCEPTION 'Migration aborted: public.wallets and public.transactions must already exist';
	END IF;

	FOR expected IN SELECT * FROM (VALUES
		('wallets', 'id', 'integer', false, true),
		('wallets', 'balance', 'real', false, true),
		('wallets', 'is_archived', 'boolean', false, true),
		('wallets', 'type', 'text', false, false),
		('wallets', 'interest_rate', 'real', false, false),
		('wallets', 'interest_period', 'text', false, false),
		('wallets', 'credit_limit', 'real', false, false),
		('wallets', 'statement_day', 'integer', true, false),
		('wallets', 'due_day', 'integer', true, false),
		('wallets', 'interest_from_first_installment', 'boolean', false, false),
		('wallets', 'source_wallet_id', 'integer', true, false),
		('wallets', 'vault_start_date', 'text', true, false),
		('wallets', 'vault_end_date', 'text', true, false),
		('wallets', 'include_in_balance', 'boolean', false, false),
		('transactions', 'id', 'integer', false, true),
		('transactions', 'type', 'text', false, true),
		('transactions', 'amount', 'real', false, true),
		('transactions', 'currency', 'text', false, true),
		('transactions', 'wallet_id', 'integer', false, true),
		('transactions', 'description', 'text', false, true),
		('transactions', 'date', 'text', false, true),
		('transactions', 'installments', 'integer', false, false),
		('transactions', 'interest_applied', 'boolean', false, false),
		('transactions', 'expense_kind', 'text', true, false)
	) AS columns(table_name, column_name, expected_type, nullable, required)
	LOOP
		SELECT format_type(a.atttypid, a.atttypmod), NOT a.attnotnull
		INTO actual_type, actual_nullable
		FROM pg_catalog.pg_attribute a
		WHERE a.attrelid = to_regclass('public.' || expected.table_name)
			AND a.attname = expected.column_name AND a.attnum > 0 AND NOT a.attisdropped;

		IF actual_type IS NULL AND expected.required THEN
			RAISE EXCEPTION 'Migration aborted: public.%.% is required and missing', expected.table_name, expected.column_name;
		END IF;
		IF actual_type IS NOT NULL AND (actual_type <> expected.expected_type OR actual_nullable <> expected.nullable) THEN
			RAISE EXCEPTION 'Migration aborted: public.%.% has incompatible type or nullability', expected.table_name, expected.column_name;
		END IF;
		actual_type := NULL;
	END LOOP;

	IF to_regclass('public.subscriptions') IS NOT NULL THEN
		EXECUTE 'SELECT count(*) FROM public.subscriptions' INTO row_count;
		FOR expected IN SELECT * FROM (VALUES
			('id', 'integer', false), ('name', 'text', false), ('amount', 'real', false),
			('currency', 'text', false), ('wallet_id', 'integer', false), ('charge_day', 'integer', false),
			('next_charge_date', 'text', false), ('last_charged_date', 'text', true),
			('is_archived', 'boolean', false), ('created_at', 'timestamp without time zone', false)
		) AS columns(column_name, expected_type, nullable)
		LOOP
			SELECT format_type(a.atttypid, a.atttypmod), NOT a.attnotnull
			INTO actual_type, actual_nullable
			FROM pg_catalog.pg_attribute a
			WHERE a.attrelid = 'public.subscriptions'::regclass
				AND a.attname = expected.column_name AND a.attnum > 0 AND NOT a.attisdropped;

			IF actual_type IS NULL AND row_count > 0 AND NOT expected.nullable THEN
				RAISE EXCEPTION 'Migration aborted: non-empty public.subscriptions is missing required column %', expected.column_name;
			END IF;
			IF actual_type IS NOT NULL AND (actual_type <> expected.expected_type OR actual_nullable <> expected.nullable) THEN
				RAISE EXCEPTION 'Migration aborted: public.subscriptions.% has incompatible type or nullability', expected.column_name;
			END IF;
			actual_type := NULL;
		END LOOP;
	END IF;

	IF to_regclass('public.subscription_charges') IS NOT NULL THEN
		EXECUTE 'SELECT count(*) FROM public.subscription_charges' INTO row_count;
		FOR expected IN SELECT * FROM (VALUES
			('subscription_id', 'integer', false), ('charge_date', 'text', false),
			('transaction_id', 'integer', true), ('created_at', 'timestamp without time zone', false)
		) AS columns(column_name, expected_type, nullable)
		LOOP
			SELECT format_type(a.atttypid, a.atttypmod), NOT a.attnotnull
			INTO actual_type, actual_nullable
			FROM pg_catalog.pg_attribute a
			WHERE a.attrelid = 'public.subscription_charges'::regclass
				AND a.attname = expected.column_name AND a.attnum > 0 AND NOT a.attisdropped;

			IF actual_type IS NULL AND row_count > 0 AND NOT expected.nullable THEN
				RAISE EXCEPTION 'Migration aborted: non-empty public.subscription_charges is missing required column %', expected.column_name;
			END IF;
			IF actual_type IS NOT NULL AND (actual_type <> expected.expected_type OR actual_nullable <> expected.nullable) THEN
				RAISE EXCEPTION 'Migration aborted: public.subscription_charges.% has incompatible type or nullability', expected.column_name;
			END IF;
			actual_type := NULL;
		END LOOP;
	END IF;

	IF to_regclass('public.subscriptions') IS NOT NULL THEN
		SELECT pg_get_constraintdef(oid) INTO constraint_definition
		FROM pg_catalog.pg_constraint
		WHERE conrelid = 'public.subscriptions'::regclass AND contype = 'p';
		IF constraint_definition IS NOT NULL AND constraint_definition <> 'PRIMARY KEY (id)' THEN
			RAISE EXCEPTION 'Migration aborted: public.subscriptions has an incompatible primary key';
		END IF;
		IF EXISTS (
			SELECT 1 FROM pg_catalog.pg_constraint
			WHERE conrelid = 'public.subscriptions'::regclass AND contype = 'f'
				AND conkey = ARRAY[(SELECT attnum FROM pg_catalog.pg_attribute WHERE attrelid = 'public.subscriptions'::regclass AND attname = 'wallet_id')]::smallint[]
				AND (confrelid <> 'public.wallets'::regclass OR confkey <> ARRAY[(SELECT attnum FROM pg_catalog.pg_attribute WHERE attrelid = 'public.wallets'::regclass AND attname = 'id')]::smallint[])
		) THEN
			RAISE EXCEPTION 'Migration aborted: public.subscriptions.wallet_id has an incompatible foreign key';
		END IF;
	END IF;

	IF to_regclass('public.subscription_charges') IS NOT NULL THEN
		SELECT pg_get_constraintdef(oid) INTO constraint_definition
		FROM pg_catalog.pg_constraint
		WHERE conrelid = 'public.subscription_charges'::regclass AND contype = 'p';
		IF constraint_definition IS NOT NULL AND constraint_definition <> 'PRIMARY KEY (subscription_id, charge_date)' THEN
			RAISE EXCEPTION 'Migration aborted: public.subscription_charges has an incompatible primary key';
		END IF;

		IF EXISTS (
			SELECT 1 FROM pg_catalog.pg_constraint
			WHERE conrelid = 'public.subscription_charges'::regclass AND contype = 'u'
				AND conkey @> ARRAY[(SELECT attnum FROM pg_catalog.pg_attribute WHERE attrelid = 'public.subscription_charges'::regclass AND attname = 'transaction_id')]::smallint[]
				AND conkey <> ARRAY[(SELECT attnum FROM pg_catalog.pg_attribute WHERE attrelid = 'public.subscription_charges'::regclass AND attname = 'transaction_id')]::smallint[]
		) THEN
			RAISE EXCEPTION 'Migration aborted: public.subscription_charges.transaction_id has an incompatible UNIQUE constraint';
		END IF;

		IF EXISTS (
			SELECT 1 FROM pg_catalog.pg_constraint
			WHERE conrelid = 'public.subscription_charges'::regclass AND contype = 'f'
				AND conkey = ARRAY[(SELECT attnum FROM pg_catalog.pg_attribute WHERE attrelid = 'public.subscription_charges'::regclass AND attname = 'subscription_id')]::smallint[]
				AND (confrelid <> 'public.subscriptions'::regclass OR confkey <> ARRAY[(SELECT attnum FROM pg_catalog.pg_attribute WHERE attrelid = 'public.subscriptions'::regclass AND attname = 'id')]::smallint[])
		) THEN
			RAISE EXCEPTION 'Migration aborted: public.subscription_charges.subscription_id has an incompatible foreign key';
		END IF;
		IF EXISTS (
			SELECT 1 FROM pg_catalog.pg_constraint
			WHERE conrelid = 'public.subscription_charges'::regclass AND contype = 'f'
				AND conkey = ARRAY[(SELECT attnum FROM pg_catalog.pg_attribute WHERE attrelid = 'public.subscription_charges'::regclass AND attname = 'transaction_id')]::smallint[]
				AND (confrelid <> 'public.transactions'::regclass OR confkey <> ARRAY[(SELECT attnum FROM pg_catalog.pg_attribute WHERE attrelid = 'public.transactions'::regclass AND attname = 'id')]::smallint[] OR confdeltype <> 'n')
		) THEN
			RAISE EXCEPTION 'Migration aborted: public.subscription_charges.transaction_id has an incompatible foreign key';
		END IF;
	END IF;
END $$;
--> statement-breakpoint
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS type text DEFAULT 'debit' NOT NULL;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS interest_rate real DEFAULT 0 NOT NULL;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS interest_period text DEFAULT 'EA' NOT NULL;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS credit_limit real DEFAULT 0 NOT NULL;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS statement_day integer;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS due_day integer;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS interest_from_first_installment boolean DEFAULT false NOT NULL;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS source_wallet_id integer;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS vault_start_date text;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS vault_end_date text;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS include_in_balance boolean DEFAULT true NOT NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS installments integer DEFAULT 1 NOT NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS interest_applied boolean DEFAULT false NOT NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS expense_kind text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.subscriptions (
	id integer GENERATED ALWAYS AS IDENTITY,
	name text NOT NULL,
	amount real NOT NULL,
	currency text DEFAULT 'COP' NOT NULL,
	wallet_id integer NOT NULL,
	charge_day integer NOT NULL,
	next_charge_date text NOT NULL,
	last_charged_date text,
	is_archived boolean DEFAULT false NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL
);
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS id integer GENERATED ALWAYS AS IDENTITY;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS name text NOT NULL;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS amount real NOT NULL;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS currency text DEFAULT 'COP' NOT NULL;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS wallet_id integer NOT NULL;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS charge_day integer NOT NULL;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS next_charge_date text NOT NULL;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS last_charged_date text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false NOT NULL;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.subscription_charges (
	subscription_id integer NOT NULL,
	charge_date text NOT NULL,
	transaction_id integer,
	created_at timestamp DEFAULT now() NOT NULL
);
ALTER TABLE public.subscription_charges ADD COLUMN IF NOT EXISTS subscription_id integer NOT NULL;
ALTER TABLE public.subscription_charges ADD COLUMN IF NOT EXISTS charge_date text NOT NULL;
ALTER TABLE public.subscription_charges ADD COLUMN IF NOT EXISTS transaction_id integer;
ALTER TABLE public.subscription_charges ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
DO $$
DECLARE
	constraint_definition text;
BEGIN
	SELECT pg_get_constraintdef(oid) INTO constraint_definition
	FROM pg_catalog.pg_constraint
	WHERE conrelid = 'public.subscriptions'::regclass AND contype = 'p';
	IF constraint_definition IS NULL THEN
		ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
	ELSIF constraint_definition <> 'PRIMARY KEY (id)' THEN
		RAISE EXCEPTION 'Migration aborted: public.subscriptions has an incompatible primary key';
	END IF;

	SELECT pg_get_constraintdef(oid) INTO constraint_definition
	FROM pg_catalog.pg_constraint
	WHERE conrelid = 'public.subscription_charges'::regclass AND contype = 'p';
	IF constraint_definition IS NULL THEN
		ALTER TABLE public.subscription_charges ADD CONSTRAINT subscription_charges_subscription_date_pk PRIMARY KEY (subscription_id, charge_date);
	ELSIF constraint_definition <> 'PRIMARY KEY (subscription_id, charge_date)' THEN
		RAISE EXCEPTION 'Migration aborted: public.subscription_charges has an incompatible primary key';
	END IF;

	SELECT pg_get_constraintdef(oid) INTO constraint_definition
	FROM pg_catalog.pg_constraint
	WHERE conrelid = 'public.subscription_charges'::regclass
		AND contype = 'u' AND conkey = ARRAY[
			(SELECT attnum FROM pg_catalog.pg_attribute WHERE attrelid = 'public.subscription_charges'::regclass AND attname = 'transaction_id')
		]::smallint[];
	IF constraint_definition IS NULL THEN
		ALTER TABLE public.subscription_charges ADD CONSTRAINT subscription_charges_transaction_id_unique UNIQUE (transaction_id);
	ELSIF constraint_definition <> 'UNIQUE (transaction_id)' THEN
		RAISE EXCEPTION 'Migration aborted: public.subscription_charges.transaction_id has an incompatible UNIQUE constraint';
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_catalog.pg_constraint
		WHERE conrelid = 'public.subscriptions'::regclass AND contype = 'f'
			AND conkey = ARRAY[(SELECT attnum FROM pg_catalog.pg_attribute WHERE attrelid = 'public.subscriptions'::regclass AND attname = 'wallet_id')]::smallint[]
			AND confrelid = 'public.wallets'::regclass
			AND confkey = ARRAY[(SELECT attnum FROM pg_catalog.pg_attribute WHERE attrelid = 'public.wallets'::regclass AND attname = 'id')]::smallint[]
	) THEN
		ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_wallet_id_wallets_id_fk
			FOREIGN KEY (wallet_id) REFERENCES public.wallets(id) NOT VALID;
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_catalog.pg_constraint
		WHERE conrelid = 'public.subscription_charges'::regclass AND contype = 'f'
			AND conkey = ARRAY[(SELECT attnum FROM pg_catalog.pg_attribute WHERE attrelid = 'public.subscription_charges'::regclass AND attname = 'subscription_id')]::smallint[]
			AND confrelid = 'public.subscriptions'::regclass
			AND confkey = ARRAY[(SELECT attnum FROM pg_catalog.pg_attribute WHERE attrelid = 'public.subscriptions'::regclass AND attname = 'id')]::smallint[]
	) THEN
		ALTER TABLE public.subscription_charges ADD CONSTRAINT subscription_charges_subscription_id_subscriptions_id_fk
			FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) NOT VALID;
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_catalog.pg_constraint
		WHERE conrelid = 'public.subscription_charges'::regclass AND contype = 'f'
			AND conkey = ARRAY[(SELECT attnum FROM pg_catalog.pg_attribute WHERE attrelid = 'public.subscription_charges'::regclass AND attname = 'transaction_id')]::smallint[]
			AND confrelid = 'public.transactions'::regclass AND confdeltype = 'n'
			AND confkey = ARRAY[(SELECT attnum FROM pg_catalog.pg_attribute WHERE attrelid = 'public.transactions'::regclass AND attname = 'id')]::smallint[]
	) THEN
		ALTER TABLE public.subscription_charges ADD CONSTRAINT subscription_charges_transaction_id_transactions_id_fk
			FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL NOT VALID;
	END IF;
END $$;
--> statement-breakpoint
INSERT INTO public.subscription_charges (subscription_id, charge_date)
SELECT id, last_charged_date
FROM public.subscriptions
WHERE last_charged_date IS NOT NULL
ON CONFLICT (subscription_id, charge_date) DO NOTHING;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.process_due_subscriptions_detailed(processing_date date)
RETURNS TABLE(processed integer, pending integer, skipped_archived integer, orphaned integer)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
	subscription_record record;
	claimed_subscription_id integer;
	created_transaction_id integer;
	scheduled_date date;
	next_month date;
	next_month_last_day integer;
	period_count integer;
	processed_count integer := 0;
	pending_count integer := 0;
	skipped_archived_count integer := 0;
	orphaned_count integer := 0;
	max_periods constant integer := 24;
BEGIN
	FOR subscription_record IN
		SELECT s.*, w.id AS existing_wallet_id, w.type AS wallet_type, w.is_archived AS wallet_is_archived
		FROM public.subscriptions s
		LEFT JOIN public.wallets w ON w.id = s.wallet_id
		WHERE s.is_archived = false AND s.next_charge_date <= processing_date::text
		FOR UPDATE OF s SKIP LOCKED
	LOOP
		IF subscription_record.existing_wallet_id IS NULL THEN
			orphaned_count := orphaned_count + 1;
			CONTINUE;
		END IF;
		IF subscription_record.wallet_is_archived THEN
			skipped_archived_count := skipped_archived_count + 1;
			CONTINUE;
		END IF;

		scheduled_date := subscription_record.next_charge_date::date;
		period_count := 0;
		WHILE scheduled_date <= processing_date AND period_count < max_periods LOOP
			claimed_subscription_id := NULL;
			INSERT INTO public.subscription_charges (subscription_id, charge_date)
			VALUES (subscription_record.id, scheduled_date::text)
			ON CONFLICT (subscription_id, charge_date) DO NOTHING
			RETURNING subscription_id INTO claimed_subscription_id;

			IF claimed_subscription_id IS NOT NULL THEN
				INSERT INTO public.transactions (
					type, amount, currency, wallet_id, description, expense_kind, date
				) VALUES (
					'expense', subscription_record.amount, subscription_record.currency,
					subscription_record.wallet_id, 'Suscripcion: ' || subscription_record.name,
					'fixed', scheduled_date::text
				)
				RETURNING id INTO created_transaction_id;

				UPDATE public.subscription_charges
				SET transaction_id = created_transaction_id
				WHERE subscription_id = subscription_record.id AND charge_date = scheduled_date::text;

				-- Negative debit balances are intentionally allowed. Credit expenses increase debt.
				UPDATE public.wallets
				SET balance = balance + CASE
					WHEN subscription_record.wallet_type = 'credit' THEN subscription_record.amount
					ELSE -subscription_record.amount
				END
				WHERE id = subscription_record.wallet_id;

				processed_count := processed_count + 1;
			END IF;

			next_month := (date_trunc('month', scheduled_date) + interval '1 month')::date;
			next_month_last_day := extract(day FROM (date_trunc('month', scheduled_date) + interval '2 months' - interval '1 day'))::integer;
			subscription_record.last_charged_date := scheduled_date::text;
			scheduled_date := make_date(
				extract(year FROM next_month)::integer,
				extract(month FROM next_month)::integer,
				least(subscription_record.charge_day, next_month_last_day)
			);
			period_count := period_count + 1;
		END LOOP;

		UPDATE public.subscriptions
		SET last_charged_date = subscription_record.last_charged_date,
			next_charge_date = scheduled_date::text
		WHERE id = subscription_record.id;
	END LOOP;

	SELECT count(*)::integer INTO pending_count
	FROM public.subscriptions s
	WHERE s.is_archived = false AND s.next_charge_date <= processing_date::text;

	RETURN QUERY SELECT processed_count, pending_count, skipped_archived_count, orphaned_count;
END;
$$;
CREATE OR REPLACE FUNCTION public.process_due_subscriptions(processing_date date)
RETURNS integer
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
	SELECT processed FROM public.process_due_subscriptions_detailed(processing_date);
$$;
