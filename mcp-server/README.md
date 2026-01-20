# Financial Projections MCP Server

A Model Context Protocol (MCP) server that exposes the Financial Projections API as tools that AI assistants can use.

## What is This?

This MCP server allows AI assistants (like Claude Desktop) to interact with your Financial Projections application. Once configured, you can ask Claude to:

- View your financial projections and balances
- Create and manage expense/income events
- Set up recurring payments
- Manage bank accounts
- Explore different financial scenarios
- Query transaction history
- And much more!

## Prerequisites

- Node.js 18+ installed
- Financial Projections app running (default: http://localhost:3000)
- Claude Desktop app (or another MCP-compatible client)

## Installation

**Note:** This is a Yarn project. Make sure you have Yarn installed.

```bash
cd /home/pete/Documents/Projects/FinancialProjections/mcp-server

# Install dependencies
yarn install

# Build the project
yarn build
```

## Configuration

### Environment Variables

Create a `.env` file in this directory (optional):

```bash
# API base URL (default: http://localhost:3000/api)
FINANCIAL_PROJECTIONS_API_URL=http://localhost:3000/api
```

### Claude Desktop Configuration

Add this server to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "financial-projections": {
      "command": "node",
      "args": ["/home/pete/Documents/Projects/FinancialProjections/mcp-server/dist/index.js"],
      "env": {
        "FINANCIAL_PROJECTIONS_API_URL": "http://localhost:3000/api"
      }
    }
  }
}
```

After updating the config, restart Claude Desktop.

## Available Tools

The MCP server provides **34 tools** that map to the Financial Projections API:

### Projection Events (5 tools)
- `get_projection_events` - Query events in a date range
- `create_projection_event` - Create a one-time event
- `get_projection_event` - Get event details
- `update_projection_event` - Update an event
- `delete_projection_event` - Delete an event

### Recurring Event Rules (4 tools)
- `get_recurring_event_rules` - List all rules
- `create_recurring_event_rule` - Create recurring events
- `update_recurring_event_rule` - Update a rule
- `delete_recurring_event_rule` - Delete a rule

### Daily Balance (3 tools)
- `get_daily_balances` - Get calculated balances
- `set_actual_balance` - Override with actual balance
- `clear_actual_balance` - Remove override

### Bank Accounts (6 tools)
- `get_bank_accounts` - List all accounts
- `create_bank_account` - Create new account
- `get_bank_account` - Get account details
- `update_bank_account` - Update account
- `delete_bank_account` - Delete account (optionally with all associated data via `deleteAll` parameter)
- `merge_bank_accounts` - Merge one account into another

### Settings (2 tools)
- `get_settings` - Get app settings
- `update_settings` - Update settings

### Decision Paths & Scenarios (5 tools)
- `get_decision_paths` - List decision paths
- `create_decision_path` - Create decision path
- `get_scenario_sets` - List scenario sets
- `create_scenario_set` - Create scenario
- `update_scenario_set` - Update scenario

### Transaction Records (1 tool)
- `get_transaction_records` - Query imported transactions

### Spending Types (4 tools)
- `get_spending_types` - List categories
- `create_spending_type` - Create category
- `update_spending_type` - Update category
- `delete_spending_type` - Delete category

### Transaction Categorization Rules (6 tools)
- `get_categorization_rules` - List all auto-categorization rules
- `get_categorization_rule` - Get rule details
- `create_categorization_rule` - Create rule to auto-tag transactions during import
- `update_categorization_rule` - Update a rule
- `delete_categorization_rule` - Delete a rule
- `apply_categorization_rule` - Apply a rule to existing transactions for a bank account

## Usage Examples

Once configured in Claude Desktop, you can interact naturally:

### Example 1: View Current Financial Position

**You:** "What's my projected balance for next month?"

**Claude:** Uses `get_bank_accounts`, `get_daily_balances`, and `get_projection_events` to show your financial overview.

### Example 2: Create a Recurring Expense

**You:** "I need to add my monthly Netflix subscription of £15.99"

**Claude:** Uses `create_recurring_event_rule` to set up the recurring payment.

### Example 3: Scenario Planning

**You:** "Show me what happens to my finances if I buy a new car for £20,000"

**Claude:** Uses `create_decision_path`, `create_projection_event`, and `get_daily_balances` to model the scenario.

### Example 4: Budget Analysis

**You:** "How much am I spending on groceries this month?"

**Claude:** Uses `get_transaction_records` and `get_spending_types` to analyze your spending.

### Example 5: Auto-Categorization Setup

**You:** "Set up automatic categorization so all TESCO transactions are tagged as groceries when I import my bank statements"

**Claude:** Uses `get_spending_types` to find the "Groceries" category, then `create_categorization_rule` to create a rule that automatically tags any transaction containing "TESCO" as groceries during CSV import.

## Development

### Build

```bash
yarn build
```

### Watch Mode (Auto-rebuild on changes)

```bash
yarn dev
```

### Debug Mode

```bash
yarn inspector
```

Then attach a debugger to the Node.js process.

## Project Structure

```
mcp-server/
├── src/
│   ├── index.ts          # Main MCP server entry point
│   ├── tools.ts          # Tool definitions
│   ├── handlers.ts       # Tool call handlers
│   └── api-client.ts     # HTTP client for API requests
├── dist/                 # Compiled JavaScript (generated)
├── package.json          # Dependencies and scripts (Yarn project)
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## How It Works

1. **MCP Protocol**: The server implements the Model Context Protocol, allowing AI assistants to discover and call tools
2. **Tool Definitions**: Each API endpoint is exposed as a tool with a JSON schema describing its parameters
3. **HTTP Proxy**: Tool calls are translated to HTTP requests to your Financial Projections API
4. **Response Formatting**: API responses are formatted as text content for the AI to process
5. **TOON Optimization**: Transaction endpoints automatically use TOON (Token Oriented Object Notation) format, reducing token usage by 60-70%

## Troubleshooting

### Claude Can't See the Tools

1. Check Claude Desktop config file syntax (valid JSON)
2. Restart Claude Desktop completely
3. Check the server path is correct
4. Ensure the server builds without errors: `yarn build`

### Tools Return Errors

1. Verify Financial Projections app is running: `curl http://localhost:3000/api/health`
2. Check the API URL in your config matches your setup
3. Look at Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`

### API Connection Failed

```bash
# Test API connectivity
curl http://localhost:3000/api/settings

# Check if port is different
curl http://localhost:3001/api/settings  # Test environment
```

Update `FINANCIAL_PROJECTIONS_API_URL` to match your running instance.

## Security Considerations

- **Local Only**: This MCP server is designed for local use only
- **No Authentication**: Currently uses the same auth model as the main app (none for single-user)
- **Localhost Binding**: Only connects to localhost by default
- **Trust Model**: MCP servers run with your user permissions - only use trusted servers

## Performance Optimizations

### TOON Format (Implemented)

The MCP server automatically uses **TOON (Token Oriented Object Notation)** format for transaction data retrieval, which provides:

- **60-70% token reduction** compared to verbose JSON
- Faster AI response times due to less data processing
- Pipe-delimited format that's highly readable for AI models
- Automatic implementation - transparent to users

**Example:**
```
TRANSACTIONS (Page 1/10, showing 100 of 1000 total)
ID|Date|Type|Description|Debit|Credit|Balance|SpendingTypes|Notes
abc12345|2025-01-15|DEB|TESCO STORES|45.67||1234.56|Groceries|Weekly shop
```

For more details, see [TOON_IMPLEMENTATION.md](/home/pete/Documents/Projects/FinancialProjection/TOON_IMPLEMENTATION.md)

## Future Enhancements

Potential improvements:

- [ ] Add authentication support when the main app adds it
- [ ] Implement resource-based tools (e.g., read-only access to specific accounts)
- [ ] Add caching for frequently accessed data
- [ ] Support for batch operations
- [ ] CSV upload capability through MCP
- [ ] Real-time balance updates via server-sent events
- [ ] Vector database integration for semantic search on transactions (Phase 2)

## Contributing

This is part of the Financial Projections application. See the main project documentation for contribution guidelines.

## License

MIT

---

## Advanced Configuration

### Custom Port

If your app runs on a different port:

```json
{
  "mcpServers": {
    "financial-projections": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "FINANCIAL_PROJECTIONS_API_URL": "http://localhost:3001/api"
      }
    }
  }
}
```

### Multiple Environments

You can configure multiple servers for different environments:

```json
{
  "mcpServers": {
    "financial-projections-dev": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "FINANCIAL_PROJECTIONS_API_URL": "http://localhost:3000/api"
      }
    },
    "financial-projections-test": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "FINANCIAL_PROJECTIONS_API_URL": "http://localhost:3001/api"
      }
    }
  }
}
```

### Remote Server (Advanced)

For connecting to a remote instance:

```json
{
  "mcpServers": {
    "financial-projections-remote": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "FINANCIAL_PROJECTIONS_API_URL": "https://your-domain.com/api"
      }
    }
  }
}
```

**Security Warning:** Ensure your remote instance has proper authentication enabled!

---

**Last Updated**: January 2026
