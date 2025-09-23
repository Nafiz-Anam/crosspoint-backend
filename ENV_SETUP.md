# Environment Setup for Image URLs

## Backend Environment Variables

Add the following to your `.env` file in the backend directory:

```env
# Application URL
# For local development
BASE_URL=http://localhost:8000

# For production (replace with your actual domain)
# BASE_URL=https://yourdomain.com
```

## How It Works

1. **Default Logo**: Frontend uses `/images/logos/main_logo.png` as the default local logo
2. **Uploaded Logos**: Backend generates full URLs using `BASE_URL` environment variable
3. **URL Examples**:
   - Local: `http://localhost:8000/uploads/logos/logo-1234567890.png`
   - Production: `https://yourdomain.com/uploads/logos/logo-1234567890.png`

## Configuration

- **Local Development**: Set `BASE_URL=http://localhost:8000`
- **Production**: Set `BASE_URL=https://yourdomain.com`
- **Default**: If not set, defaults to `http://localhost:8000`

## File Structure

```
backend/
├── public/
│   └── uploads/
│       └── logos/
│           └── logo-*.png (uploaded logos)
└── .env (add BASE_URL here)

frontend/
└── public/
    └── images/
        └── logos/
            └── main_logo.png (default logo)
```
