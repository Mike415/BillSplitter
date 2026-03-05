# Bill Splitter

A clean, fast web app for splitting trip expenses and dinner bills fairly among a group.

## Features

- **Add people** — name everyone in your group; click to rename, hover to remove
- **Track expenses** — log each expense with a description, total amount, and who paid
- **Flexible splits:**
  - **Even** — divide the total equally among all participants
  - **$ Amount** — assign specific dollar amounts to some people; the rest share the remainder equally
  - **% Percent** — assign specific percentages to some people; the rest share the remaining % equally
- **Per-person summary** — see how much each person paid, their fair share, and their net balance
- **Settle up** — calculates the minimum number of payments needed to settle all debts (greedy debt-reduction algorithm)
- **Persistent state** — your bill is saved to localStorage so you won't lose data on refresh
- **Editable title** — rename your bill (e.g. "Cabo Trip 2025")

## Tech Stack

- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Framer Motion for animations
- Vite for bundling
- localStorage for persistence (no backend required)

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### Split Logic

For **even** splits: `share = total / participantCount`

For **amount** splits: explicit amounts are honored; the remainder (`total - sum(explicit)`) is divided equally among participants without an explicit amount.

For **percent** splits: explicit percentages are honored; the remaining percentage (`100 - sum(explicit)%`) is divided equally among participants without an explicit percentage.

### Settlement Algorithm

Uses a greedy algorithm to minimize the number of transactions:
1. Compute each person's net balance (paid - owed)
2. Repeatedly match the largest creditor with the largest debtor
3. Record a payment and reduce both balances
4. Repeat until all balances are settled (within a small epsilon for floating-point tolerance)

This produces the optimal (minimum) number of payments in O(n log n) time.
