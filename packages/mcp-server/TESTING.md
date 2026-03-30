# Testing the ScopePad MCP Server

## Local Development

### 1. Setup

```bash
cd packages/mcp-server
npm install
```

### 2. Run in Dev Mode

```bash
export SCOPEPAD_API_KEY=sp_test_xxxxxxxxxxxxx
npm run dev
```

The server will start on stdin/stdout. If it connects successfully, you'll see debug output (set `DEBUG=1` for verbose logging).

### 3. Manual Tool Testing (Optional)

You can send MCP requests directly if you have the @modelcontextprotocol/sdk client:

```typescript
// Example with MCP SDK client
const client = new Client(...);
const result = await client.callTool('list_documents', { limit: 10 });
```

Or via stdio with a test harness:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list_documents"}' | node dist/index.ts
```

## Integration Testing

### Claude Desktop

1. Build the server:
   ```bash
   npm run build
   ```

2. Update your `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "scopepad": {
         "command": "node",
         "args": ["/absolute/path/to/packages/mcp-server/dist/index.js"],
         "env": {
           "SCOPEPAD_API_KEY": "sp_test_xxxxxxxxxxxxx"
         }
       }
     }
   }
   ```

3. Restart Claude Desktop

4. In Claude, you should see "scopepad" listed as an available MCP server

5. Test tools:
   - "List my documents"
   - "Create a new proposal for Acme Corp"
   - "Show my clients"
   - "What templates are available?"

### Cursor

Same as Claude Desktop, but update `.cursor/mcp_config.json` or Cursor settings instead.

## Debugging

### Enable Debug Logging

```bash
DEBUG=1 SCOPEPAD_API_KEY=sp_... npm run dev
```

This will log:
- MCP method calls received
- API client requests
- Errors with full stack traces

### Common Issues

**"MCP server won't connect"**
- Check Node.js version: `node --version` (need 18+)
- Verify SCOPEPAD_API_KEY is set: `echo $SCOPEPAD_API_KEY`
- Check stderr for detailed error messages

**"API returns 401 Unauthorized"**
- API key is invalid or expired
- Get a fresh key from ScopePad settings
- Make sure no extra spaces in the key

**"Tool calls hang or timeout"**
- Check internet connection to app.scopepad.com
- Verify ScopePad API is responding: `curl https://app.scopepad.com/health`
- Check firewall/proxy isn't blocking requests

**"TypeError: fetch is not defined"**
- Requires Node.js 18+ (has native fetch)
- Check you're running Node 18.x or higher: `node --version`

## Lint & Type Check

While the package.json doesn't include linting, you can manually check:

```bash
# Type check (no emit)
npx tsc --noEmit

# Build
npm run build

# Look for any build errors
```

## Unit Testing (Future)

Currently there are no unit tests. To add them:

```bash
npm install --save-dev jest @types/jest ts-jest

# Create jest.config.js
# Create src/*.test.ts files
# Update package.json with test script
```

## Performance Testing

The server is designed for typical LLM use cases (listing docs, creating documents). For stress testing:

```bash
# If you implement batch operations later:
# - Test list_documents with large limit (1000+)
# - Test rapid successive create_document calls
# - Monitor memory usage with `node --inspect`
```

## Security Testing

Before publishing:

1. **Verify no secrets in code:**
   ```bash
   grep -r "sk_live\|sk_test\|Bearer" src/ --exclude="*.ts"
   ```

2. **Check environment handling:**
   - No API key logged to console (except DEBUG preview)
   - No keys in error messages
   - API key required, server exits if missing

3. **Verify API errors don't leak data:**
   - Run tool with invalid ID → check error message
   - Send malformed request → check error message

4. **SSL/TLS verification:**
   - All API calls use https://
   - Verify no cert warnings in Node

## Publishing Test

Before publishing to npm:

```bash
# Build
npm run build

# Dry run (shows what will be published)
npm publish --dry-run

# Check dist/ folder has everything needed:
ls dist/
# Should see: index.js, api-client.js, index.d.ts, api-client.d.ts (etc)

# Test global install
npm link
scopepad-mcp --help  # Should work
```

## Real API Testing (Post-Launch)

Once published to npm, test real usage:

```bash
# Install globally
npm install -g @scopepad/mcp-server

# Use in Claude Desktop with npx
# Tools should work without local setup
```

## Checklist Before Merge

- [ ] `npm install` works
- [ ] `npm run build` produces no errors
- [ ] Built output in `dist/` folder
- [ ] `dist/index.js` has shebang and is executable
- [ ] All 12 tools have proper input schemas
- [ ] All 3 resources defined
- [ ] Error messages don't leak API keys
- [ ] README has setup instructions
- [ ] Can start server: `SCOPEPAD_API_KEY=test npm run dev`
- [ ] TypeScript types are correct (strict mode)
