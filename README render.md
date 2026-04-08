# Pam Plus Backend

Backend server for Pam Plus - handles Anthropic API calls and Shopify subscription verification.

## Environment Variables Required

Set these in Render.com dashboard:

- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `SHOPIFY_STORE` - Your store URL (e.g. pamcentral.myshopify.com)
- `SHOPIFY_ADMIN_TOKEN` - Your Shopify Admin API token

## Endpoints

- `POST /api/verify` - Verify subscriber email
- `POST /api/chat` - Chat with Pam (requires active subscription)
- `GET /` - Health check
