# Instagram Integration Setup Guide

This guide will help you connect your Instagram account to the SugarBowl website to display real Instagram posts.

## Prerequisites
- Instagram Business or Creator account
- Facebook Developer account
- Website must be served over HTTPS (required by Instagram)

## Step 1: Create Facebook Developer App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Consumer" as app type
4. Fill in app details:
   - App name: "SugarBowl Website"
   - Contact email: your email
   - Purpose: "Yourself or your own business"

## Step 2: Add Instagram Basic Display Product

1. In your app dashboard, click "Add Product"
2. Find "Instagram Basic Display" and click "Set Up"
3. Go to Instagram Basic Display → Basic Display
4. Click "Create New App" in the Instagram App section

## Step 3: Configure Instagram App

1. **Display Name**: SugarBowl Website
2. **Valid OAuth Redirect URIs**: Add your website URL
   - For local testing: `http://localhost:8000`
   - For production: `https://yourdomain.com`
3. **Deauthorize Callback URL**: Same as redirect URI
4. **Data Deletion Request URL**: Same as redirect URI
5. Save changes

## Step 4: Add Instagram Testers

1. Go to "Roles" → "Roles" in your app dashboard  
2. Click "Add Instagram Testers"
3. Enter the Instagram username for @thesugarbowlkzoo
4. The Instagram account owner needs to accept the invitation:
   - Go to Instagram app → Settings → Privacy → Apps and Websites
   - Accept the tester invitation

## Step 5: Generate Access Token

### Option A: Using Graph API Explorer (Recommended)
1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from dropdown
3. Generate User Access Token for Instagram Basic Display
4. Grant permissions: `user_profile`, `user_media`
5. Copy the access token

### Option B: Manual Authorization Flow
1. Create authorization URL:
```
https://api.instagram.com/oauth/authorize
  ?client_id={your-app-id}
  &redirect_uri={your-redirect-uri}
  &scope=user_profile,user_media
  &response_type=code
```
2. Visit the URL and authorize
3. Exchange code for access token using your app secret

## Step 6: Configure the Website

1. Open `js/instagram.js`
2. Update the CONFIG section:

```javascript
const CONFIG = {
    // Replace with your actual values
    accessToken: 'IGQVJYour_Long_Access_Token_Here',
    userId: 'your_instagram_user_id', // Usually same as app ID
    
    // Display settings (you can customize these)
    maxPosts: 6,
    cacheExpiration: 3600, // 1 hour
    fallbackToPlaceholders: true,
    
    // Set to false in production
    debugMode: false
};
```

## Step 7: Handle Token Expiration

Instagram Basic Display access tokens expire after 60 days. You have two options:

### Option A: Manual Refresh (Simple)
- Every ~50 days, repeat Step 5 to get a new token
- Update the token in `js/instagram.js`

### Option B: Automatic Refresh (Advanced)
- Implement server-side token refresh using your app secret
- Store tokens securely server-side
- Create API endpoint to provide fresh tokens to your website

## Step 8: Testing

1. Open browser developer console
2. Look for Instagram module logs
3. If configured correctly, you should see: "Fetched X Instagram posts"
4. If not configured, it will fall back to placeholder images

## Troubleshooting

### Common Issues:

**"Access token is invalid"**
- Token may be expired (60-day limit)
- Generate new token following Step 5

**"Instagram Testers" not working**
- Make sure the Instagram account accepted the tester invitation
- Check that you're using the correct Instagram username

**CORS errors**
- Instagram API must be called from the same domain configured in your app
- For local testing, use `localhost` not `127.0.0.1`

**No posts showing**
- Check browser console for error messages
- Verify the Instagram account has public posts
- Make sure `maxPosts` is set to a reasonable number (1-25)

### Rate Limits
- Instagram Basic Display: 200 requests per hour per user
- The website caches posts for 1 hour to stay well within limits

## Production Deployment

1. Set `debugMode: false` in CONFIG
2. Update redirect URIs to your production domain
3. Consider implementing server-side token refresh
4. Monitor API usage in Facebook Developer console

## Alternative: Embed Individual Posts

If the API setup is too complex, you can embed individual Instagram posts:

1. Go to an Instagram post
2. Click the "..." menu → "Embed"
3. Copy the embed code
4. Replace the placeholder grid in `index.html` with the embed codes

This method requires manual updates but needs no API setup.