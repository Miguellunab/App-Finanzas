CREATE TABLE IF NOT EXISTS public.card_payment_periods (
	wallet_id integer NOT NULL REFERENCES public.wallets(id),
	period_start text NOT NULL,
	period_end text NOT NULL,
	status text NOT NULL,
	amount real,
	source_wallet_id integer REFERENCES public.wallets(id),
	transaction_id integer REFERENCES public.transactions(id) ON DELETE SET NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	PRIMARY KEY (wallet_id, period_start, period_end)
);
