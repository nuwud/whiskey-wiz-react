# GitHub PAT Setup Guide

## Fine-Grained Personal Access Token Configuration

1. Token Requirements:
   - Repository: whiskey-wiz-react
   - Permissions needed:
     - Contents: Read & Write
     - Pull Requests: Read & Write
     - Metadata: Read-only

2. Generation Steps:
   - Visit: GitHub Settings > Developer settings > Personal access tokens
   - Select: Fine-grained tokens
   - Set repository access: whiskey-wiz-react
   - Set permissions as listed above
   - Set expiration based on project needs

3. Environment Setup:
   ```env
   GITHUB_PAT=your_token_here
   ```

4. MCP Usage:
   ```typescript
   // Headers needed for GitHub API calls
   headers: {
     Authorization: `Bearer ${process.env.GITHUB_PAT}`,
     Accept: 'application/vnd.github.v3+json'
   }
   ```

## Security Notes
- Never commit tokens to repository
- Use environment variables
- Rotate tokens regularly
- Set appropriate expiration

## Troubleshooting
- 401: Token invalid or expired
- 403: Insufficient permissions
- 404: Repository or resource not found