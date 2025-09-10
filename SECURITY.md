# Security Configuration Guide

## 🔒 Environment Variables Setup

### 1. Create your .env file
```bash
cp backend/.env.example backend/.env
```

### 2. Update the .env file with your credentials
Edit `backend/.env` and replace the placeholder values with your actual credentials:
- `MONGODB_URI`: Your MongoDB connection string
- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: A secure random string for JWT tokens

### 3. Never commit sensitive data
The following files should NEVER be committed to version control:
- `backend/.env`
- Any file containing API keys, passwords, or secrets
- SSL certificates (*.pem, *.key, *.crt)

## 🛡️ Security Best Practices

### Environment Variables
- ✅ Store all sensitive data in `.env` files
- ✅ Use `.env.example` as a template without real values
- ✅ Add `.env` to `.gitignore` (already configured)
- ❌ Never hardcode credentials in source code
- ❌ Never commit `.env` files to Git

### Database Security
- ✅ Use MongoDB connection strings with authentication
- ✅ Enable SSL/TLS for database connections
- ✅ Use database user with minimal required permissions
- ❌ Don't use admin credentials for application access

### API Security
- ✅ Use HTTPS in production
- ✅ Implement rate limiting
- ✅ Validate all user inputs
- ✅ Use CORS properly configured
- ✅ Implement authentication/authorization

### Git Security
- ✅ Review commits before pushing
- ✅ Use `git status` to check tracked files
- ✅ If you accidentally commit sensitive data:
  ```bash
  # Remove from history
  git filter-branch --force --index-filter \
    "git rm --cached --ignore-unmatch PATH_TO_FILE" \
    --prune-empty --tag-name-filter cat -- --all
  ```

## 🔍 Security Checklist

Before deploying or committing:
- [ ] All API keys are in `.env` file
- [ ] `.env` is in `.gitignore`
- [ ] No hardcoded passwords in code
- [ ] Database connection uses authentication
- [ ] CORS is properly configured
- [ ] Input validation is implemented
- [ ] Error messages don't expose sensitive info

## 🚨 If You Exposed Credentials

If you accidentally exposed credentials:
1. **Immediately** rotate/change the exposed credentials
2. Remove the credentials from Git history
3. Check if credentials were used unauthorizedly
4. Update all systems using these credentials
5. Enable monitoring/alerts for suspicious activity

## 📝 Additional Resources

- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)