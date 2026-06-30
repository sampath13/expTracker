---
name: security-privacy
description: Use when handling PII, authentication, authorization, secrets, tokens, encryption, input validation, consent flags, or any code touching user data. Use when the user asks about security, privacy, PDPA, or data protection. Use ONLY for expTracker code touching security-sensitive concerns.
---

# Security & Privacy — expTracker

Applies to all tiers: `apps/mobile/`, `apps/api/`, `apps/ocr-service/`.

## Core Principle

This app handles **PDPA-governed personal data** (email, mobile, purchase history, receipt images) serving Singapore users. Every piece of code touching user data must be privacy-first.

## Secret Management

```bash
# ❌ NEVER commit secrets to any file tracked by git
# ❌ NEVER hardcode keys, tokens, connection strings in source

# ✅ .env files are gitignored — provide .env.example templates
# .gitignore must include:
.env
*.pem
*.key
*.pfx
credentials.json
service-account.json
```

```csharp
// ✅ .NET: Use IOptions<T> + User Secrets in dev
// appsettings.json — public defaults only (no secrets)
// appsettings.Development.json — gitignored OR use dotnet user-secrets

// ✅ Read JWT key from env/secure store, never from appsettings.json
var jwtKey = Environment.GetEnvironmentVariable("JWT__KEY")
    ?? throw new InvalidOperationException("JWT__KEY not configured");

// ❌ Avoid:
// "Jwt": { "Key": "my-super-secret-key-123" }  ← in appsettings.json, COMMITTED
```

```python
# ✅ Python: read from env via pydantic-settings
class Settings(BaseSettings):
    jwt_secret: str

    model_config = SettingsConfigDict(env_prefix="JWT_")

# ❌ Avoid:
# JWT_SECRET = "hardcoded-secret"  ← never in source
```

```typescript
// ✅ React Native: use react-native-keychain for tokens
import * as Keychain from 'react-native-keychain';

await Keychain.setGenericPassword('jwt', token);
// NEVER store tokens in AsyncStorage — it's plaintext

// ✅ API keys go in .env (gitignored), read via react-native-config
// ❌ Avoid: export const API_KEY = 'sk-123...';  ← in source
```

## PDPA Data Classification

| Data | Classification | Retention Rule |
|---|---|---|
| Email, mobile, Google ID | Personal (PDPA) | Until account deletion |
| Bills, bill_items | Personal (PDPA) | Until user deletes bill |
| Receipt images | Personal + temporary | Delete immediately on confirm; max 2-hr TTL |
| Comparison pool (canonical_name, chain, unit_price, month) | **Anonymised** (outside PDPA) | Indefinite |
| JWT tokens | Access credentials | 15 min (access), 30 days refresh rotation |
| Refresh token hashes | Hashed credentials | Max 30 days, revoke on use |

## Hard Rules — Enforce at Code Review

### 1. No PII in Logs
```csharp
// ❌ AVOID — logs email
_logger.LogInformation("User {Email} scanned a bill", user.Email);

// ✅ Use user ID only
_logger.LogInformation("User {UserId} scanned a bill", user.Id);

// ✅ If email is needed for debugging, redact:
_logger.LogDebug("Processing for user {EmailHash}", HashEmail(user.Email));
```

```python
# ❌ AVOID
logger.info(f"Scanning receipt for {user_email}")

# ✅
logger.info("Scanning receipt", extra={"user_id": user_id})
```

### 2. No PII in Comparison Pool
```csharp
// The prices table must NEVER contain:
// - user_id    ❌
// - bill_id    ❌
// - full date  ❌ (only observed_month YYYY-MM)
// - email      ❌
// - mobile     ❌

// ✅ Only write anonymised data:
var priceEntry = new Price
{
    ProductId = canonicalProduct.Id,
    ChainId = chain.Id,
    Price = confirmedItem.UnitPrice,
    Unit = confirmedItem.Unit,
    ObservedMonth = DateTime.UtcNow.ToString("yyyy-MM"),  // month only
    Source = "user_scan",
    // NO UserId, NO BillId, NO full DateTime
};
```

### 3. Image Lifecycle — Delete Aggressively
```csharp
// ✅ Delete S3 object IMMEDIATELY after confirm — not "scheduled", not "later"
public async Task ConfirmBillAsync(ConfirmRequest request, Guid userId)
{
    // ... save to DBs ...

    // Delete image NOW — unconditionally
    await _s3Service.DeleteObjectAsync(request.ObjectKey);

    // Double-check: if delete fails, log CRITICAL and retry
    // Never leave an image beyond 2-hour TTL fallback
}

// ✅ S3 bucket policy: auto-expire objects after 2 hours (backstop)
// Only triggers if the immediate delete failed
```

### 4. Auth Token Handling
```csharp
// ✅ JWT: 15-min expiry, no exceptions
var tokenDescriptor = new SecurityTokenDescriptor
{
    Expires = DateTime.UtcNow.AddMinutes(15),
    // ...
};

// ✅ Refresh token rotation: revoke old on use
public async Task<TokenResponse> RefreshAsync(string refreshToken)
{
    var storedToken = await FindTokenAsync(refreshToken);
    if (storedToken is null || storedToken.Revoked || storedToken.ExpiresAt < DateTime.UtcNow)
        throw new UnauthorizedAccessException("Invalid refresh token");

    // Revoke old token FIRST (prevents replay)
    storedToken.Revoked = true;
    await _context.SaveChangesAsync();

    // Issue new pair
    return await IssueTokensAsync(storedToken.UserId);
}

// ✅ Store refresh token as SHA256 hash in DB — never plaintext
var tokenHash = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
```

### 5. Input Validation
```csharp
// ✅ Validate ALL user input at the boundary
public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).MaximumLength(128);
        RuleFor(x => x.Mobile).Matches(@"^\+65[689]\d{7}$")
            .When(x => !string.IsNullOrEmpty(x.Mobile));
    }
}

// ✅ Never trust client-provided IDs for authorization
[HttpGet("{id}")]
public async Task<ActionResult> GetBill(Guid id)
{
    var userId = User.GetUserId();  // from JWT, not request body
    var bill = await _billService.GetUserBillAsync(id, userId);
    // Always filter by userId — never serve bills by ID alone
}
```

### 6. Consent Enforcement
```csharp
// ✅ Check consent flag BEFORE writing to comparison pool
if (user.CommunityContribution)
{
    await WriteToComparisonPoolAsync(confirmedItems);
}
// If false: skip silently — bill saved to personal DB only

// ✅ Consent change: do NOT retroactively remove existing data
// Future contributions only — past data is already anonymised

// ✅ Consent audit trail:
public class ConsentAudit
{
    public Guid UserId { get; set; }
    public string Field { get; set; }       // "community_contribution"
    public bool OldValue { get; set; }
    public bool NewValue { get; set; }
    public DateTime ChangedAt { get; set; }
}
```

## Mobile-Specific

```typescript
// ✅ Secure storage for tokens — never AsyncStorage
import * as Keychain from 'react-native-keychain';

// ✅ Blur detection before upload — don't send low-quality PII images
if (blurScore < BLUR_THRESHOLD) {
    showRetakePrompt();
    return;
}

// ✅ Delete local image after upload
await RNFS.unlink(tempImagePath);

// ✅ Certificate pinning for API calls (production)
// ✅ ProGuard/R8 obfuscation for Android release builds
```

## What to Look For in Code Review

| Red Flag | Action |
|---|---|
| `Console.WriteLine(user.Email)` | Remove — use structured logger with ID only |
| `prices.UserId = userId` | Block — never write PII to comparison pool |
| `Expires = DateTime.UtcNow.AddDays(365)` | Reject — JWT must be 15 min max |
| Hardcoded secret/key/token | Reject — move to env vars / secure store |
| `catch { }` (empty catch) | Flag — at minimum log the error |
| SQL without parameters | Reject — use EF Core LINQ or parameterized queries |
| Unvalidated file upload | Flag — check content type, size limit |
| `GET /bills/{id}` without user filter | Block — must filter by JWT user ID |
| Image not deleted after confirm | Block — must delete S3 object immediately |
