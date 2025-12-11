# TWA (Trusted Web Activity) Setup for Google Play Store

This guide explains how to build and deploy the Atreides Companion app as a TWA to Google Play Store using GitHub Actions.

## Overview

The app uses [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) to create a Trusted Web Activity (TWA) - an Android app that wraps your PWA using Chrome Custom Tabs.

## Prerequisites

1. **GitHub Repository Secrets** - Add these to your repository settings:
   - `KEYSTORE_PASSWORD`: Password for your Android keystore
   - `KEY_PASSWORD`: Password for your signing key

2. **Domain Setup**:
   - Your PWA must be served from `https://dune.how`
   - Add a `.well-known/assetlinks.json` file for Digital Asset Links (see below)

## Local Build (Optional)

If you want to build locally instead of using GitHub Actions:

```bash
# Install Bubblewrap CLI
npm install -g @bubblewrap/cli

# Initialize the project (one-time setup)
bubblewrap init --manifest=https://dune.how/manifest.json

# Build the APK
bubblewrap build

# The APK will be in app-release-signed.apk
```

## GitHub Actions Workflow

The workflow in `.github/workflows/build-twa.yml` automatically:
1. Builds the APK and AAB (Android App Bundle) on every push to main
2. Creates GitHub releases with attached APK/AAB files when you push a version tag

### Triggering a Build

**Automatic (on every push to main):**
```bash
git add .
git commit -m "Update app"
git push origin main
```

**Manual trigger:**
Go to GitHub → Actions → Build TWA APK → Run workflow

**Create a release:**
```bash
git tag v1.0.0
git push origin v1.0.0
```

## Setting Up Your Keystore

### First Time Setup

1. **Generate a keystore locally:**
```bash
keytool -genkey -v -keystore android.keystore -alias android -keyalg RSA -keysize 2048 -validity 10000
```

2. **Extract the SHA-256 fingerprint:**
```bash
keytool -list -v -keystore android.keystore -alias android
```
Look for the SHA-256 fingerprint (e.g., `14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5`)

3. **Add keystore to repository** (encrypted):
   - **Option A**: Store as GitHub secret (recommended for small keystores)
     - Base64 encode: `base64 android.keystore > keystore.b64`
     - Add as secret `KEYSTORE_BASE64` in GitHub
     - Modify workflow to decode it
   
   - **Option B**: Commit encrypted keystore
     ```bash
     # Encrypt the keystore
     gpg --symmetric --cipher-algo AES256 android.keystore
     # Commit android.keystore.gpg to repository
     ```

4. **Add passwords to GitHub Secrets:**
   - Go to repository Settings → Secrets and variables → Actions
   - Add `KEYSTORE_PASSWORD` (the keystore password)
   - Add `KEY_PASSWORD` (the alias password)

## Digital Asset Links

Create a file at `https://dune.how/.well-known/assetlinks.json`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "how.dune.twa",
    "sha256_cert_fingerprints": [
      "YOUR_SHA256_FINGERPRINT_HERE"
    ]
  }
}]
```

Replace `YOUR_SHA256_FINGERPRINT_HERE` with the SHA-256 from your keystore (with colons).

## Uploading to Google Play Store

1. **First Upload (Manual):**
   - Download `app-release-bundle.aab` from GitHub Actions artifacts or releases
   - Go to [Google Play Console](https://play.google.com/console)
   - Create a new app
   - Upload the AAB file to Internal Testing track first
   - Fill in app details, screenshots, descriptions

2. **Subsequent Uploads:**
   - Increment `appVersionCode` in `twa-manifest.json`
   - Push changes or create a new tag
   - Download new AAB from GitHub Actions
   - Upload to Google Play Console

## Testing

### Test the APK before uploading:
```bash
# Install on connected device/emulator
adb install app-release-signed.apk

# Or use bundletool for AAB testing
bundletool build-apks --bundle=app-release-bundle.aab --output=app.apks
bundletool install-apks --apks=app.apks
```

## Troubleshooting

### "App not installed" error
- Check Digital Asset Links are properly configured
- Verify domain ownership in Google Play Console
- Ensure SHA-256 fingerprint matches

### Build fails in GitHub Actions
- Verify secrets are set correctly
- Check that `twa-manifest.json` has valid URLs
- Ensure manifest.json is accessible at https://dune.how/manifest.json

### Digital Asset Links verification fails
- Test at: https://developers.google.com/digital-asset-links/tools/generator
- Ensure `.well-known/assetlinks.json` is served with correct CORS headers
- Check that the file returns `Content-Type: application/json`

## Resources

- [Bubblewrap Documentation](https://github.com/GoogleChromeLabs/bubblewrap/tree/main/packages/cli)
- [TWA Quick Start Guide](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Digital Asset Links](https://developers.google.com/digital-asset-links)
- [Google Play Console](https://play.google.com/console)
