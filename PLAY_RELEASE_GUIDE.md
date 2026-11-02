# OrdersHub: Google Play release guide

Everything here can be done from a phone browser. Do the steps in order. Each one says what it unblocks.

Package name: `com.indiedev.ordershub` · App name: **OrdersHub**

---

## Step 1: Merge the release branch into `main` (5 min)

The release work is on `claude/app-play-store-status-0n6ygo` in **both** repos. Merge it into `main` in each:

- **Backend (`orders-hub-BE`):** Railway deploys `main`, so merging ships the new account-deletion endpoint (`DELETE /api/v1/users/me`). **The app's "Delete account" button needs this deployed first.**
- **App (`orders-hub-FE`):** GitHub only shows the "Run workflow" button for workflows on the default branch, and GitHub Pages will serve `docs/` from `main`.

## Step 2: Turn on GitHub Pages (2 min)

`orders-hub-FE` → **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main`, folder: `/docs` → Save.

After a minute these must open:
- https://rohit-munde.github.io/orders-hub-FE/privacy.html
- https://rohit-munde.github.io/orders-hub-FE/terms.html
- https://rohit-munde.github.io/orders-hub-FE/delete-account.html

Before you share them, replace `{{SUPPORT_EMAIL}}` in the three pages with your real support email. Ask Claude to do it.

## Step 3: Add the signing secrets to GitHub (5 min)

Open the `ordershub-github-secrets.txt` file Claude sent you. In `orders-hub-FE` → **Settings → Secrets and variables → Actions → New repository secret**, create these four, copying each name and value exactly:

| Secret name | Value |
|---|---|
| `ORDERSHUB_UPLOAD_KEYSTORE_BASE64` | the long single line in the file |
| `ORDERSHUB_UPLOAD_STORE_PASSWORD` | from the file |
| `ORDERSHUB_UPLOAD_KEY_PASSWORD` | from the file |
| `ORDERSHUB_UPLOAD_KEY_ALIAS` | `ordershub-upload` |

Save `ordershub-upload.keystore` and the secrets file somewhere private, such as Google Drive. If you lose them, Play can reset the upload key, but that takes a few days.

## Step 4: Google Cloud: let the new package sign in with Google (10 min)

Google Sign-In only works when Google Cloud knows the app's package name and signing certificate. The old package `com.ordershubmobile` no longer exists, so add new clients.

Open https://console.cloud.google.com → project **orders-hub-project** → **Google Auth Platform → Clients → Create client → Android**:

| Client name | Package name | SHA-1 certificate fingerprint |
|---|---|---|
| OrdersHub upload | `com.indiedev.ordershub` | `23:0F:53:DE:40:85:FF:7D:F6:28:1F:69:9E:59:36:FD:F6:E9:7D:4B` |
| OrdersHub debug (local development) | `com.indiedev.ordershub` | `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` |
| OrdersHub Play | `com.indiedev.ordershub` | **Add after Step 7:** Play Console → your app → Test and release → Setup → App signing → "App signing key certificate" SHA-1 |

The third client matters most. Apps installed from Google Play are re-signed by Google, so **sign-in fails with `DEVELOPER_ERROR` on Play installs until that client exists.**

Leave the existing **Web** client as it is. The app and backend already use it.

## Step 5: Google Cloud: OAuth consent screen (10 min)

**Google Auth Platform → Branding:**
- App name: `OrdersHub`
- User support email and developer contact: your support email
- App home page: `https://rohit-munde.github.io/orders-hub-FE/`
- Privacy policy: `https://rohit-munde.github.io/orders-hub-FE/privacy.html`
- Terms of service: `https://rohit-munde.github.io/orders-hub-FE/terms.html`

**Audience:** set the publishing status to **In production**. Until Google verifies the Gmail permission, this allows up to 100 users in total. They see an "unverified app" warning but are not signed out every 7 days, which is what happens in Testing mode. That suits the closed test.

**Data access:** the scopes must be `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile` and `.../auth/gmail.readonly`.

Submitting the Gmail permission for verification is Step 10, after the closed test has started.

## Step 6: Build the bundle (1 tap, about 15 min of waiting)

`orders-hub-FE` → **Actions → Android release bundle → Run workflow** → version `1.0.0` → Run.

When it turns green, open the run → **Artifacts → ordershub-release-aab** → download. Inside the zip is `app-release.aab`.

If it fails, send Claude the failing step's log. This is the first time the Android build runs with the new package name and signing, so a small fix may be needed.

## Step 7: Create the Play developer account and the app

1. https://play.google.com/console/signup. Choose a **Personal** account: US$25 one-time, plus identity verification, which can take a few days. Organisation accounts skip the 12-tester rule but need a D-U-N-S number.
2. **Create app:** name `OrdersHub`, language English (India) or English (US), type **App**, **Free**. Accept the declarations.
3. **Test and release → Testing → Internal testing → Create release:** upload `app-release.aab` and accept **Play App Signing**. Add yourself as a tester and install from the opt-in link. This is the fastest way to check that the Play-signed build works. Remember the third OAuth client in Step 4.

## Step 8: Fill in "App content" (Policy → App content)

Answers that match how OrdersHub actually works:

**Privacy policy:** `https://rohit-munde.github.io/orders-hub-FE/privacy.html`

**App access:** "All or some functionality is restricted" → add instructions:
> Sign in with Google using the test account below, then allow read-only Gmail access. The test inbox contains sample order emails. Username: `<test gmail>` Password: `<password>`

Create a fresh Gmail account for reviewers. Turn **off** 2-step verification on it. Forward a few real order confirmation emails into it so the home screen has orders.

**Ads:** No, the app does not contain ads.

**Content rating:** run the questionnaire. Category: **Utility, Productivity, Communication or Other**. Answer "No" to everything about violence, sexual content, gambling and so on. Users can't interact or share content with each other.

**Target audience:** **18 and over** only. This matches the privacy policy and terms.

**News app:** No. **Government app:** No.

**Financial features:** OrdersHub doesn't lend, pay, trade or hold money. If the form offers a personal-finance or budgeting option, describe it as a read-only view of the user's own order history. Otherwise choose "My app doesn't provide any financial features".

**Health:** No health features.

**Data safety:**

| Question | Answer |
|---|---|
| Does your app collect or share user data? | Yes |
| Is all data encrypted in transit? | Yes |
| Can users request deletion? | Yes: in-app, plus `https://rohit-munde.github.io/orders-hub-FE/delete-account.html` |

Data types to declare (all **collected**, none **shared**; service providers acting for you don't count as sharing):

| Data type | Required or optional | Processed ephemerally? | Purposes |
|---|---|---|---|
| Personal info → Name | Required | No | App functionality, Account management |
| Personal info → Email address | Required | No | App functionality, Account management |
| Personal info → User IDs | Required | No | App functionality, Account management |
| Financial info → Purchase history | Required | No | App functionality |
| Messages → Emails | Required | **Yes** (email text is read to extract orders, then discarded) | App functionality |

Don't declare location, contacts, photos, device IDs, app activity or crash logs. OrdersHub doesn't collect them.

## Step 9: Store listing (Grow users → Store presence → Main store listing)

**App name** (max 30): `OrdersHub: Order Tracker`

**Short description** (max 80):
> Every online order from your Gmail inboxes in one place, with delivery OTPs.

**Full description:**
> OrdersHub finds the order and shipping confirmation emails in your Gmail and turns them into one simple list, so you never have to dig through your inbox to check on a parcel again.
>
> WHAT YOU GET
> • Every order in one place: Amazon, Flipkart, Myntra, Meesho, Swiggy, Zomato and many more
> • Order status at a glance: ordered, shipped, out for delivery, delivered, refunded
> • Delivery OTPs ready to copy when the courier arrives
> • Amounts, items and merchant logos for each order
> • Copy an order number in one tap when you contact support
> • Connect more than one Gmail account
>
> PRIVATE BY DESIGN
> • Read-only Gmail access, used only for order-related emails
> • Email text is processed to extract orders and never stored
> • No ads. Your data is never sold or used to train AI models
> • Disconnect Gmail or delete your account any time, right from the app
>
> OrdersHub's use of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.

**Category:** Shopping. **Contact email:** your support email. **Website:** `https://rohit-munde.github.io/orders-hub-FE/`

**Graphics:**
- App icon: 512 × 512 PNG (Claude can generate this from the app icon)
- Feature graphic: 1024 × 500 PNG (Claude can generate this)
- Phone screenshots: 2 to 8, taken on your phone. Suggested: home screen with orders, an order after tapping "Show OTP", the profile screen with connected inboxes, and the sign-in screen.

## Step 10: Closed test, then production

1. **Testing → Closed testing → Create track**, upload the same `.aab` (or a newer one), and add at least **12 testers** by email (a Google Group is easiest). New personal accounts need **12 testers opted in for 14 days in a row** before they can apply for production. Ask testers to actually open the app during those days.
2. Testers sign in through the "unverified app" warning (Advanced → Go to OrdersHub). They count toward the 100-user limit for unverified apps.
3. **While the test runs, submit the Gmail permission for verification:** Google Auth Platform → Verification Center. You need:
   - **Scope justification:** *"OrdersHub is a package and order-tracking app. It reads only order and shipping confirmation emails, matched by sender and subject, to show the user's orders, their items, amounts and delivery status in the app. When the user taps "Show OTP" on an order, it searches their recent mail for that order number and reads the delivery OTP to show them. The OTP is never stored. gmail.metadata is not enough because order numbers, items, amounts and OTPs are only in the message body. Message bodies are processed in memory and never stored. Extracted order data is never sold, shared for ads or used to train AI models, and is deleted when the user disconnects Gmail or deletes their account."*
   - **Demo video** (unlisted YouTube, 2 to 3 minutes, screen recording from your phone):
     1. Open the app and tap "Continue with Google".
     2. Show the consent screen, with its URL and the Gmail permission visible.
     3. Show orders appearing on the home screen, then tap "Show OTP" on an order that is on its way.
     4. Open Profile: show the privacy policy link, disconnecting Gmail, and deleting the account.
   - Google may then ask for a **CASA security assessment** (see the feasibility report). Do what they ask before going to production.
4. After 14 days: **Publishing overview → Apply for production.** Answer the questions about your closed test honestly.
5. **Publish to production only once Google has approved the Gmail permission.** Before then, only 100 people can ever sign in.

---

## Quick reference

| Item | Value |
|---|---|
| Package | `com.indiedev.ordershub` |
| Upload key alias | `ordershub-upload` |
| Upload key SHA-1 | `23:0F:53:DE:40:85:FF:7D:F6:28:1F:69:9E:59:36:FD:F6:E9:7D:4B` |
| Debug key SHA-1 | `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` |
| Production API | `https://orders-hub-be-production.up.railway.app` |
| Privacy policy | `https://rohit-munde.github.io/orders-hub-FE/privacy.html` |
| Account deletion page | `https://rohit-munde.github.io/orders-hub-FE/delete-account.html` |
